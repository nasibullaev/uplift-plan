import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { UserService } from "../users/user.service";
import { SendVerificationCodeDto, VerifyPhoneDto } from "../users/dto/user.dto";
import { UserDocument } from "../users/schemas/user.schema";

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async sendVerificationCode(sendVerificationCodeDto: SendVerificationCodeDto) {
    // Generate a mock verification code (123456 as requested)
    const verificationCode = "123456";

    // Set expiration time (5 minutes from now)
    const verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Check if user exists, if not create one
    let user;
    try {
      user = await this.userService.findByPhone(sendVerificationCodeDto.phone);
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

    // In a real implementation, you would send SMS here
    // For now, we'll just return success
    return {
      message: "Verification code sent successfully",
      // In development, you might want to return the code for testing
      // code: verificationCode,
    };
  }

  async verifyPhone(verifyPhoneDto: VerifyPhoneDto) {
    const user = await this.userService.findByPhoneWithVerification(
      verifyPhoneDto.phone
    );

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if verification code is valid and not expired
    if (
      user.verificationCode !== verifyPhoneDto.code ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < new Date()
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

    // Generate JWT token and return user data
    const loginResult = await this.userService.loginWithPhone(
      verifyPhoneDto.phone
    );

    return {
      message: "Phone verified successfully",
      data: loginResult,
    };
  }
}
