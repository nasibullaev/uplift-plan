import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as crypto from "crypto-js";

export interface PaymePaymentRequest {
  orderId: string;
  amount: number;
  description?: string;
  returnUrl?: string;
}

export interface PaymePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface PaymeCallbackData {
  id: string;
  method: string;
  params: {
    id: string;
    account: {
      orderId: string;
    };
    amount: number;
    time: number;
    reason?: number;
  };
}

export interface PaymeTransaction {
  id: string;
  orderId: string;
  amount: number;
  state: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name);
  private readonly merchantId: string;
  private readonly merchantKey: string;
  private readonly baseUrl: string;
  private readonly callbackUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantId = this.configService.get<string>("PAYME_MERCHANT_ID");
    this.merchantKey = this.configService.get<string>("PAYME_MERCHANT_KEY");
    this.baseUrl =
      this.configService.get<string>("PAYME_API_URL") ||
      "https://checkout.paycom.uz/api";

    // Alternative URLs to try if the default doesn't work
    this.logger.log(`Using Payme API URL: ${this.baseUrl}`);
    this.logger.log(`Alternative URLs to try if this fails:`);
    this.logger.log(`- https://checkout.paycom.uz/api`);
    this.logger.log(`- https://payme.uz/api`);
    this.logger.log(`- https://api.payme.uz`);
    this.callbackUrl =
      this.configService.get<string>("PAYME_CALLBACK_URL") ||
      `${this.configService.get<string>("CLIENT_URL") || "https://930f6eba2712.ngrok-free.app"}/api/payments/payme/callback`;

    if (!this.merchantId || !this.merchantKey) {
      throw new Error("Payme credentials not configured");
    }

    // Log configuration for debugging
    this.logger.log(`Payme Service initialized:`);
    this.logger.log(`- Merchant ID: ${this.merchantId ? "SET" : "NOT SET"}`);
    this.logger.log(`- Merchant Key: ${this.merchantKey ? "SET" : "NOT SET"}`);
    this.logger.log(`- Base URL: ${this.baseUrl}`);
    this.logger.log(`- Callback URL: ${this.callbackUrl}`);
  }

  /**
   * Create a payment request
   */
  async createPayment(
    paymentRequest: PaymePaymentRequest
  ): Promise<PaymePaymentResponse> {
    try {
      const { orderId, amount, description, returnUrl } = paymentRequest;

      // Validate input parameters
      if (!orderId || typeof orderId !== "string") {
        throw new BadRequestException(
          "Order ID is required and must be a string"
        );
      }

      if (!amount || typeof amount !== "number" || amount <= 0) {
        throw new BadRequestException(
          "Amount is required and must be a positive number"
        );
      }

      // Validate amount (minimum 1000 tiyin = 10 UZS)
      if (amount < 1000) {
        throw new BadRequestException(
          "Amount must be at least 1000 tiyin (10 UZS)"
        );
      }

      this.logger.log(`Creating payment with params:`, {
        orderId,
        amount,
        description,
        returnUrl,
        merchantId: this.merchantId,
        baseUrl: this.baseUrl,
      });

      const params = {
        id: this.generateId(),
        method: "cards.create",
        params: {
          amount: amount,
          account: {
            orderId: orderId,
          },
        },
      };

      const signature = this.generateSignature(params);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.log(
        `Creating payment for order ${orderId} with amount ${amount}`
      );

      // Log the full request for debugging
      this.logger.debug("Payme API Request:", JSON.stringify(params, null, 2));
      this.logger.debug("Request Headers:", JSON.stringify(headers, null, 2));

      const response = await axios.post(this.baseUrl, params, { headers });

      if (response.data.result && response.data.result.card) {
        return {
          success: true,
          paymentUrl: response.data.result.card.url,
          transactionId: response.data.result.card.token,
        };
      } else {
        this.logger.error("Payment creation failed:", response.data);
        this.logger.error("Response status:", response.status);
        this.logger.error("Response headers:", response.headers);
        return {
          success: false,
          error: response.data.error?.message || "Payment creation failed",
        };
      }
    } catch (error) {
      this.logger.error("Error creating payment:", error);
      this.logger.error("Error response data:", error.response?.data);
      this.logger.error("Error status:", error.response?.status);
      return {
        success: false,
        error:
          error.response?.data?.error?.message ||
          error.message ||
          "Payment creation failed",
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(transactionId: string): Promise<PaymeTransaction | null> {
    try {
      const params = {
        id: this.generateId(),
        method: "cards.get_verify_code",
        params: {
          token: transactionId,
        },
      };

      const signature = this.generateSignature(params);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      const response = await axios.post(this.baseUrl, params, { headers });

      if (response.data.result) {
        return {
          id: transactionId,
          orderId: response.data.result.account?.orderId || "",
          amount: response.data.result.amount || 0,
          state: response.data.result.state || 0,
          createdAt: new Date(response.data.result.create_time * 1000),
          updatedAt: new Date(
            response.data.result.perform_time * 1000 || Date.now()
          ),
        };
      }

      return null;
    } catch (error) {
      this.logger.error("Error verifying payment:", error);
      return null;
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(
    transactionId: string
  ): Promise<{ state: number; amount: number } | null> {
    try {
      const params = {
        id: this.generateId(),
        method: "cards.get_status",
        params: {
          token: transactionId,
        },
      };

      const signature = this.generateSignature(params);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      const response = await axios.post(this.baseUrl, params, { headers });

      if (response.data.result) {
        return {
          state: response.data.result.state,
          amount: response.data.result.amount,
        };
      }

      return null;
    } catch (error) {
      this.logger.error("Error checking payment status:", error);
      return null;
    }
  }

  /**
   * Handle Payme callback
   */
  async handleCallback(
    callbackData: PaymeCallbackData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { id, method, params } = callbackData;

      this.logger.log(`Received callback: ${method} for transaction ${id}`);

      switch (method) {
        case "cards.check_perform_transaction":
          return this.handleCheckPerformTransaction(params);

        case "cards.perform_transaction":
          return this.handlePerformTransaction(params);

        case "cards.cancel_transaction":
          return this.handleCancelTransaction(params);

        case "cards.get_statement":
          return this.handleGetStatement(params);

        default:
          this.logger.warn(`Unknown callback method: ${method}`);
          return { success: false, error: "Unknown method" };
      }
    } catch (error) {
      this.logger.error("Error handling callback:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString();
  }

  /**
   * Generate signature for authentication
   */
  private generateSignature(params: any): string {
    const data = JSON.stringify(params);
    const signature = crypto.HmacSHA256(data, this.merchantKey).toString();

    this.logger.debug("Signature generation:", {
      data,
      merchantKey: this.merchantKey ? "SET" : "NOT SET",
      signature,
    });

    return signature;
  }

  /**
   * Test method to verify signature generation
   */
  testSignatureGeneration(): { success: boolean; error?: string; data?: any } {
    try {
      const testParams = {
        id: "123456789",
        method: "cards.create",
        params: {
          amount: 100000,
          account: {
            orderId: "test_order_123",
          },
        },
      };

      const signature = this.generateSignature(testParams);

      return {
        success: true,
        data: {
          testParams,
          signature,
          merchantId: this.merchantId,
          merchantKeySet: !!this.merchantKey,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle check perform transaction callback
   */
  private async handleCheckPerformTransaction(
    params: any
  ): Promise<{ success: boolean; error?: string }> {
    const { account, amount } = params;
    const orderId = account.orderId;

    // Here you should validate the order exists and amount matches
    // For now, we'll return success
    this.logger.log(
      `Checking transaction for order ${orderId} with amount ${amount}`
    );

    return { success: true };
  }

  /**
   * Handle perform transaction callback
   */
  private async handlePerformTransaction(
    params: any
  ): Promise<{ success: boolean; error?: string }> {
    const { id, account, amount } = params;
    const orderId = account.orderId;

    this.logger.log(
      `Performing transaction ${id} for order ${orderId} with amount ${amount}`
    );

    // Here you should update your database to mark the payment as completed
    // This will be handled by the payment controller

    return { success: true };
  }

  /**
   * Handle cancel transaction callback
   */
  private async handleCancelTransaction(
    params: any
  ): Promise<{ success: boolean; error?: string }> {
    const { id, account, reason } = params;
    const orderId = account.orderId;

    this.logger.log(
      `Cancelling transaction ${id} for order ${orderId}, reason: ${reason}`
    );

    // Here you should update your database to mark the payment as cancelled

    return { success: true };
  }

  /**
   * Handle get statement callback
   */
  private async handleGetStatement(
    params: any
  ): Promise<{ success: boolean; error?: string }> {
    const { from, to } = params;

    this.logger.log(`Getting statement from ${from} to ${to}`);

    // Here you should return transaction history
    // For now, we'll return empty array

    return { success: true };
  }

  /**
   * Convert UZS to tiyin (multiply by 100)
   */
  convertToTiyin(uzsAmount: number): number {
    return Math.round(uzsAmount * 100);
  }

  /**
   * Convert tiyin to UZS (divide by 100)
   */
  convertToUzs(tiyinAmount: number): number {
    return tiyinAmount / 100;
  }

  /**
   * Create a payment URL using GET method (simpler approach)
   */
  createCheckoutUrl(
    orderId: string,
    amount: number,
    returnUrl?: string,
    language: string = "ru"
  ): string {
    const params = {
      m: this.merchantId,
      "ac.order_id": orderId,
      a: amount,
      l: language,
      c:
        returnUrl ||
        `${this.configService.get<string>("CLIENT_URL") || "https://930f6eba2712.ngrok-free.app"}/payment/success`,
    };

    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join(";");

    const encodedParams = Buffer.from(paramString).toString("base64");
    return `https://checkout.paycom.uz/${encodedParams}`;
  }

  /**
   * Alternative payment creation method with minimal parameters
   */
  async createPaymentSimple(
    orderId: string,
    amount: number,
    description?: string
  ): Promise<PaymePaymentResponse> {
    try {
      this.logger.log(
        `Creating simple payment for order ${orderId} with amount ${amount}`
      );

      const params = {
        id: this.generateId(),
        method: "cards.create",
        params: {
          amount: amount,
          account: {
            orderId: orderId,
          },
        },
      };

      const signature = this.generateSignature(params);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.debug(
        "Simple Payme API Request:",
        JSON.stringify(params, null, 2)
      );
      this.logger.debug(
        "Simple Request Headers:",
        JSON.stringify(headers, null, 2)
      );

      const response = await axios.post(this.baseUrl, params, { headers });

      this.logger.debug(
        "Simple Payme API Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (response.data.result && response.data.result.card) {
        return {
          success: true,
          paymentUrl: response.data.result.card.url,
          transactionId: response.data.result.card.token,
        };
      } else {
        this.logger.error("Simple payment creation failed:", response.data);
        return {
          success: false,
          error: response.data.error?.message || "Payment creation failed",
        };
      }
    } catch (error) {
      this.logger.error("Error creating simple payment:", error);
      this.logger.error("Error response data:", error.response?.data);
      return {
        success: false,
        error:
          error.response?.data?.error?.message ||
          error.message ||
          "Payment creation failed",
      };
    }
  }

  /**
   * Try receipts.create method as alternative
   */
  async createReceiptPayment(
    orderId: string,
    amount: number,
    description?: string
  ): Promise<PaymePaymentResponse> {
    try {
      this.logger.log(
        `Creating receipt payment for order ${orderId} with amount ${amount}`
      );

      const params = {
        id: this.generateId(),
        method: "receipts.create",
        params: {
          amount: amount,
          account: {
            orderId: orderId,
          },
        },
      };

      const signature = this.generateSignature(params);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.debug(
        "Receipt Payme API Request:",
        JSON.stringify(params, null, 2)
      );

      const response = await axios.post(this.baseUrl, params, { headers });

      this.logger.debug(
        "Receipt Payme API Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (response.data.result && response.data.result.receipt) {
        return {
          success: true,
          paymentUrl: response.data.result.receipt.url,
          transactionId: response.data.result.receipt._id,
        };
      } else {
        this.logger.error("Receipt payment creation failed:", response.data);
        return {
          success: false,
          error: response.data.error?.message || "Payment creation failed",
        };
      }
    } catch (error) {
      this.logger.error("Error creating receipt payment:", error);
      this.logger.error("Error response data:", error.response?.data);
      return {
        success: false,
        error:
          error.response?.data?.error?.message ||
          error.message ||
          "Payment creation failed",
      };
    }
  }
}
