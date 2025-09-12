import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { OtpService } from "./otp.service";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly otpService: OtpService
  ) {}

  /**
   * Send SMS using Play Mobile API
   * @param phone - Phone number to send SMS to
   * @param text - SMS text content
   */
  async sendSms(phone: string, text: string): Promise<void> {
    try {
      const url = this.configService.get<string>("PLAY_MOBILE_URL");
      const login = this.configService.get<string>("PLAY_MOBILE_LOGIN");
      const password = this.configService.get<string>("PLAY_MOBILE_PASSWORD");
      const originator = this.configService.get<string>(
        "PLAY_MOBILE_ORIGINATOR"
      );
      if (!url || !login || !password || !originator) {
        throw new Error("Play Mobile configuration is missing");
      }

      const token = Buffer.from(`${login}:${password}`).toString("base64");
      const messageId = this.otpService.generateMessageId(12);

      const body = {
        messages: [
          {
            recipient: phone,
            "message-id": messageId,
            sms: {
              originator: originator,
              content: {
                text,
              },
            },
          },
        ],
      };

      await axios.post(`${url}/send`, body, {
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds timeout
      });

      this.logger.log(
        `SMS sent successfully to ${phone} with message ID: ${messageId}`
      );
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}:`, error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send OTP verification code via SMS
   * @param phone - Phone number to send OTP to
   * @param otpCode - OTP code to send
   */
  async sendOtpCode(phone: string, otpCode: string): Promise<void> {
    const message = `Ibrat Academy ilovasida ro'yxatdan o'tish uchun tasdiqlash kod: ${otpCode}`;
    await this.sendSms(phone, message);
  }
}
