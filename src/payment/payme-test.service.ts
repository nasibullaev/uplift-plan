import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as crypto from "crypto-js";

export interface PaymeTestRequest {
  method: string;
  params: any;
  id: string;
}

export interface PaymeTestResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string;
}

@Injectable()
export class PaymeTestService {
  private readonly logger = new Logger(PaymeTestService.name);
  private readonly merchantId: string;
  private readonly merchantKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantId = this.configService.get<string>("PAYME_MERCHANT_ID");
    this.merchantKey = this.configService.get<string>("PAYME_MERCHANT_KEY");
    this.baseUrl =
      this.configService.get<string>("PAYME_API_URL") ||
      "https://checkout.paycom.uz/api";

    if (!this.merchantId || !this.merchantKey) {
      throw new Error("Payme credentials not configured");
    }
  }

  /**
   * Test Payme API connection and authentication
   */
  async testConnection(): Promise<PaymeTestResponse> {
    try {
      const testRequest: PaymeTestRequest = {
        method: "CheckPerformTransaction",
        params: {
          account: {
            orderId: "test_order_123",
          },
          amount: 100000, // 1000 UZS in tiyin
        },
        id: Date.now().toString(),
      };

      const signature = this.generateSignature(testRequest);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.log("Testing Payme API connection...");
      this.logger.debug("Test Request:", JSON.stringify(testRequest, null, 2));
      this.logger.debug("Headers:", JSON.stringify(headers, null, 2));

      const response = await axios.post(this.baseUrl, testRequest, { headers });

      this.logger.log(
        "Payme API Response:",
        JSON.stringify(response.data, null, 2)
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        "Payme API Test Error:",
        error.response?.data || error.message
      );
      return {
        error: {
          code: -31000,
          message:
            error.response?.data?.error?.message ||
            error.message ||
            "Connection test failed",
        },
      };
    }
  }

  /**
   * Test CheckPerformTransaction method
   */
  async testCheckPerformTransaction(
    orderId: string,
    amount: number
  ): Promise<PaymeTestResponse> {
    try {
      const request: PaymeTestRequest = {
        method: "CheckPerformTransaction",
        params: {
          account: {
            orderId: orderId,
          },
          amount: amount,
        },
        id: Date.now().toString(),
      };

      const signature = this.generateSignature(request);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.log(`Testing CheckPerformTransaction for order ${orderId}`);
      const response = await axios.post(this.baseUrl, request, { headers });

      return response.data;
    } catch (error) {
      this.logger.error(
        "CheckPerformTransaction Error:",
        error.response?.data || error.message
      );
      return {
        error: {
          code: -31000,
          message:
            error.response?.data?.error?.message ||
            error.message ||
            "CheckPerformTransaction failed",
        },
      };
    }
  }

  /**
   * Test CreateTransaction method
   */
  async testCreateTransaction(
    orderId: string,
    amount: number
  ): Promise<PaymeTestResponse> {
    try {
      const request: PaymeTestRequest = {
        method: "CreateTransaction",
        params: {
          id: Date.now().toString(),
          account: {
            orderId: orderId,
          },
          amount: amount,
          time: Date.now(),
        },
        id: Date.now().toString(),
      };

      const signature = this.generateSignature(request);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.log(`Testing CreateTransaction for order ${orderId}`);
      const response = await axios.post(this.baseUrl, request, { headers });

      return response.data;
    } catch (error) {
      this.logger.error(
        "CreateTransaction Error:",
        error.response?.data || error.message
      );
      return {
        error: {
          code: -31000,
          message:
            error.response?.data?.error?.message ||
            error.message ||
            "CreateTransaction failed",
        },
      };
    }
  }

  /**
   * Test CheckTransaction method
   */
  async testCheckTransaction(
    transactionId: string
  ): Promise<PaymeTestResponse> {
    try {
      const request: PaymeTestRequest = {
        method: "CheckTransaction",
        params: {
          id: transactionId,
        },
        id: Date.now().toString(),
      };

      const signature = this.generateSignature(request);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.log(
        `Testing CheckTransaction for transaction ${transactionId}`
      );
      const response = await axios.post(this.baseUrl, request, { headers });

      return response.data;
    } catch (error) {
      this.logger.error(
        "CheckTransaction Error:",
        error.response?.data || error.message
      );
      return {
        error: {
          code: -31000,
          message:
            error.response?.data?.error?.message ||
            error.message ||
            "CheckTransaction failed",
        },
      };
    }
  }

  /**
   * Test PerformTransaction method
   */
  async testPerformTransaction(
    transactionId: string
  ): Promise<PaymeTestResponse> {
    try {
      const request: PaymeTestRequest = {
        method: "PerformTransaction",
        params: {
          id: transactionId,
        },
        id: Date.now().toString(),
      };

      const signature = this.generateSignature(request);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.log(
        `Testing PerformTransaction for transaction ${transactionId}`
      );
      const response = await axios.post(this.baseUrl, request, { headers });

      return response.data;
    } catch (error) {
      this.logger.error(
        "PerformTransaction Error:",
        error.response?.data || error.message
      );
      return {
        error: {
          code: -31000,
          message:
            error.response?.data?.error?.message ||
            error.message ||
            "PerformTransaction failed",
        },
      };
    }
  }

  /**
   * Test CancelTransaction method
   */
  async testCancelTransaction(
    transactionId: string,
    reason: number = 1
  ): Promise<PaymeTestResponse> {
    try {
      const request: PaymeTestRequest = {
        method: "CancelTransaction",
        params: {
          id: transactionId,
          reason: reason,
        },
        id: Date.now().toString(),
      };

      const signature = this.generateSignature(request);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.log(
        `Testing CancelTransaction for transaction ${transactionId}`
      );
      const response = await axios.post(this.baseUrl, request, { headers });

      return response.data;
    } catch (error) {
      this.logger.error(
        "CancelTransaction Error:",
        error.response?.data || error.message
      );
      return {
        error: {
          code: -31000,
          message:
            error.response?.data?.error?.message ||
            error.message ||
            "CancelTransaction failed",
        },
      };
    }
  }

  /**
   * Test GetStatement method
   */
  async testGetStatement(from: number, to: number): Promise<PaymeTestResponse> {
    try {
      const request: PaymeTestRequest = {
        method: "GetStatement",
        params: {
          from: from,
          to: to,
        },
        id: Date.now().toString(),
      };

      const signature = this.generateSignature(request);
      const headers = {
        "Content-Type": "application/json",
        "X-Auth": `${this.merchantId}:${signature}`,
      };

      this.logger.log(`Testing GetStatement from ${from} to ${to}`);
      const response = await axios.post(this.baseUrl, request, { headers });

      return response.data;
    } catch (error) {
      this.logger.error(
        "GetStatement Error:",
        error.response?.data || error.message
      );
      return {
        error: {
          code: -31000,
          message:
            error.response?.data?.error?.message ||
            error.message ||
            "GetStatement failed",
        },
      };
    }
  }

  /**
   * Generate signature for authentication
   */
  private generateSignature(params: any): string {
    const data = JSON.stringify(params);
    const signature = crypto.HmacSHA256(data, this.merchantKey).toString();
    return signature;
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
   * Get configuration info for debugging
   */
  getConfigInfo(): any {
    return {
      merchantId: this.merchantId ? "SET" : "NOT SET",
      merchantKey: this.merchantKey ? "SET" : "NOT SET",
      baseUrl: this.baseUrl,
      environment: process.env.NODE_ENV,
    };
  }
}

