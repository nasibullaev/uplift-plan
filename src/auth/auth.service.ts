import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { UserService } from "../users/user.service";
import { UserPlanService } from "../user-plan/user-plan.service";
import { PlanService } from "../plan/plan.service";
import { SendVerificationCodeDto, VerifyPhoneDto } from "../users/dto/user.dto";
import { UserDocument } from "../users/schemas/user.schema";
import { OtpService } from "./otp.service";
import { SmsService } from "./sms.service";
import { RateLimitService } from "./rate-limit.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly userPlanService: UserPlanService,
    private readonly planService: PlanService,
    private readonly otpService: OtpService,
    private readonly smsService: SmsService,
    private readonly rateLimitService: RateLimitService
  ) {}

  async sendVerificationCode(sendVerificationCodeDto: SendVerificationCodeDto) {
    try {
      // Check rate limiting
      if (!this.rateLimitService.canRequestOtp(sendVerificationCodeDto.phone)) {
        const status = this.rateLimitService.getRateLimitStatus(
          sendVerificationCodeDto.phone
        );
        const timeUntilReset = Math.ceil(status.timeUntilReset / 1000 / 60); // Convert to minutes

        throw new UnauthorizedException(
          `Too many OTP requests. Please wait ${timeUntilReset} minutes before requesting again.`
        );
      }

      // Generate a random verification code
      const verificationCode = this.otpService.generateOtp(6);

      // Set expiration time (5 minutes from now)
      const verificationCodeExpires = this.otpService.getOtpExpirationTime();

      // Check if user exists, if not create one
      let user;
      try {
        user = await this.userService.findByPhone(
          sendVerificationCodeDto.phone
        );
      } catch (error) {
        // User not found, create new one
        user = await this.userService.create({
          phone: sendVerificationCodeDto.phone,
        });
      }

      // Update user with verification code
      await this.userService.updateVerificationCode(
        (user as UserDocument)._id.toString(),
        {
          verificationCode,
          verificationCodeExpires,
        }
      );

      // Send SMS with verification code
      await this.smsService.sendOtpCode(
        sendVerificationCodeDto.phone,
        verificationCode
      );

      this.logger.log(
        `Verification code sent to ${sendVerificationCodeDto.phone}`
      );

      const remainingAttempts = this.rateLimitService.getRemainingAttempts(
        sendVerificationCodeDto.phone
      );

      return {
        message: "Verification code sent successfully",
        remainingAttempts,
        // In development, you might want to return the code for testing
        // code: verificationCode,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send verification code to ${sendVerificationCodeDto.phone}:`,
        error.message
      );
      throw error;
    }
  }

  async verifyPhone(verifyPhoneDto: VerifyPhoneDto) {
    try {
      const user = await this.userService.findByPhoneWithVerification(
        verifyPhoneDto.phone
      );

      if (!user) {
        throw new NotFoundException("User not found");
      }

      // Validate OTP format
      if (!this.otpService.validateOtpFormat(verifyPhoneDto.code)) {
        throw new UnauthorizedException("Invalid verification code format");
      }

      // Check if verification code is valid and not expired
      if (
        user.verificationCode !== verifyPhoneDto.code ||
        !user.verificationCodeExpires ||
        this.otpService.isOtpExpired(user.verificationCodeExpires)
      ) {
        throw new UnauthorizedException("Invalid or expired verification code");
      }

      // Mark phone as verified and clear verification code
      await this.userService.updateVerificationCode(
        (user as UserDocument)._id.toString(),
        {
          phoneVerified: true,
          verificationCode: null,
          verificationCodeExpires: null,
        }
      );

      // Check if user already has a plan
      const existingUserPlan = await this.userPlanService.findByUserId(
        (user as UserDocument)._id.toString()
      );

      // If user doesn't have a plan, assign the free plan
      if (!existingUserPlan || existingUserPlan.length === 0) {
        try {
          const freePlan = await this.planService.findFreePlan();
          await this.userPlanService.createFreePlanForUser(
            (user as UserDocument)._id.toString()
          );
        } catch (error) {
          console.error("Failed to assign free plan to user:", error);
          // Don't throw error here to avoid breaking the verification flow
          // The user can still proceed without a plan
        }
      }

      // Generate JWT token and return user data
      const loginResult = await this.userService.loginWithPhone(
        verifyPhoneDto.phone
      );

      this.logger.log(`Phone ${verifyPhoneDto.phone} verified successfully`);

      return {
        message: "Phone verified successfully",
        data: loginResult,
      };
    } catch (error) {
      this.logger.error(
        `Phone verification failed for ${verifyPhoneDto.phone}:`,
        error.message
      );
      throw error;
    }
  }
}
