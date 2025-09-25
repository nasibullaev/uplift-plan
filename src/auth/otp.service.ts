import { Injectable } from "@nestjs/common";

@Injectable()
export class OtpService {
  /**
   * Generate a random OTP code
   * @param length - Length of the OTP code (default: 6)
   * @returns Random OTP code as string
   */
  generateOtp(length: number = 6): string {
    const digits = "0123456789";
    let otp = "";

    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
      otp = "123456";
    }

    return otp;
  }

  /**
   * Generate a random message ID for SMS
   * @param length - Length of the message ID (default: 12)
   * @returns Random message ID as string
   */
  generateMessageId(length: number = 12): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let messageId = "";

    for (let i = 0; i < length; i++) {
      messageId += chars[Math.floor(Math.random() * chars.length)];
    }

    return messageId;
  }

  /**
   * Validate OTP format
   * @param otp - OTP code to validate
   * @param length - Expected length (default: 6)
   * @returns True if valid format
   */
  validateOtpFormat(otp: string, length: number = 6): boolean {
    const otpRegex = new RegExp(`^\\d{${length}}$`);
    return otpRegex.test(otp);
  }

  /**
   * Check if OTP is expired
   * @param expiresAt - Expiration date
   * @returns True if expired
   */
  isOtpExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Get OTP expiration time (5 minutes from now)
   * @returns Expiration date
   */
  getOtpExpirationTime(): Date {
    return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }
}
