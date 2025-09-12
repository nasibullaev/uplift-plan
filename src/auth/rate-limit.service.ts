import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly rateLimitMap = new Map<
    string,
    { count: number; resetTime: number }
  >();

  // Rate limiting configuration
  private readonly OTP_RATE_LIMIT = 5; // Max 5 OTP requests
  private readonly OTP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
  private readonly OTP_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown between requests

  /**
   * Check if phone number can request OTP
   * @param phone - Phone number to check
   * @returns True if allowed, false if rate limited
   */
  canRequestOtp(phone: string): boolean {
    const now = Date.now();
    const key = `otp:${phone}`;
    const record = this.rateLimitMap.get(key);

    if (!record) {
      // First request
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + this.OTP_WINDOW_MS,
      });
      return true;
    }

    // Check if window has expired
    if (now > record.resetTime) {
      // Reset the counter
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + this.OTP_WINDOW_MS,
      });
      return true;
    }

    // Check if within cooldown period
    const lastRequestTime =
      record.resetTime -
      this.OTP_WINDOW_MS +
      (record.count - 1) * this.OTP_COOLDOWN_MS;
    if (now - lastRequestTime < this.OTP_COOLDOWN_MS) {
      this.logger.warn(`OTP request too frequent for ${phone}`);
      return false;
    }

    // Check if within rate limit
    if (record.count >= this.OTP_RATE_LIMIT) {
      this.logger.warn(`OTP rate limit exceeded for ${phone}`);
      return false;
    }

    // Increment counter
    record.count++;
    this.rateLimitMap.set(key, record);
    return true;
  }

  /**
   * Get remaining attempts for a phone number
   * @param phone - Phone number to check
   * @returns Number of remaining attempts
   */
  getRemainingAttempts(phone: string): number {
    const key = `otp:${phone}`;
    const record = this.rateLimitMap.get(key);

    if (!record) {
      return this.OTP_RATE_LIMIT;
    }

    const now = Date.now();
    if (now > record.resetTime) {
      return this.OTP_RATE_LIMIT;
    }

    return Math.max(0, this.OTP_RATE_LIMIT - record.count);
  }

  /**
   * Get time until rate limit resets
   * @param phone - Phone number to check
   * @returns Time in milliseconds until reset
   */
  getTimeUntilReset(phone: string): number {
    const key = `otp:${phone}`;
    const record = this.rateLimitMap.get(key);

    if (!record) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  /**
   * Reset rate limit for a phone number (for testing purposes)
   * @param phone - Phone number to reset
   */
  resetRateLimit(phone: string): void {
    const key = `otp:${phone}`;
    this.rateLimitMap.delete(key);
    this.logger.log(`Rate limit reset for ${phone}`);
  }

  /**
   * Clean up expired rate limit records
   */
  cleanupExpiredRecords(): void {
    const now = Date.now();
    for (const [key, record] of this.rateLimitMap.entries()) {
      if (now > record.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  /**
   * Get rate limit status for a phone number
   * @param phone - Phone number to check
   * @returns Rate limit status object
   */
  getRateLimitStatus(phone: string): {
    canRequest: boolean;
    remainingAttempts: number;
    timeUntilReset: number;
    isInCooldown: boolean;
  } {
    const canRequest = this.canRequestOtp(phone);
    const remainingAttempts = this.getRemainingAttempts(phone);
    const timeUntilReset = this.getTimeUntilReset(phone);

    // Check if in cooldown
    const key = `otp:${phone}`;
    const record = this.rateLimitMap.get(key);
    const now = Date.now();
    const isInCooldown =
      record &&
      now -
        (record.resetTime -
          this.OTP_WINDOW_MS +
          (record.count - 1) * this.OTP_COOLDOWN_MS) <
        this.OTP_COOLDOWN_MS;

    return {
      canRequest,
      remainingAttempts,
      timeUntilReset,
      isInCooldown: !!isInCooldown,
    };
  }
}
