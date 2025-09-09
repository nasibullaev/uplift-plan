import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { SendVerificationCodeDto, VerifyPhoneDto } from "../users/dto/user.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("send-verification-code")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send verification code to phone number" })
  @ApiResponse({
    status: 200,
    description: "Verification code sent successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid phone number" })
  async sendVerificationCode(
    @Body() sendVerificationCodeDto: SendVerificationCodeDto
  ) {
    const result = await this.authService.sendVerificationCode(
      sendVerificationCodeDto
    );
    return result;
  }

  @Post("verify-phone")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify phone number with code" })
  @ApiResponse({ status: 200, description: "Phone verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid verification code" })
  @ApiResponse({ status: 404, description: "User not found" })
  async verifyPhone(@Body() verifyPhoneDto: VerifyPhoneDto) {
    const result = await this.authService.verifyPhone(verifyPhoneDto);
    return result;
  }
}
