#!/usr/bin/env node

/**
 * Payme Integration Test Script
 * 
 * This script helps test the Payme integration by providing various test scenarios
 * and validating the API responses.
 */

import axios from 'axios';
import * as crypto from 'crypto-js';

interface TestConfig {
  baseUrl: string;
  merchantId: string;
  merchantKey: string;
  testOrderId: string;
  testAmount: number;
}

interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  data?: any;
  responseTime?: number;
}

class PaymeIntegrationTester {
  private config: TestConfig;
  private results: TestResult[] = [];

  constructor(config: TestConfig) {
    this.config = config;
  }

  /**
   * Generate signature for authentication
   */
  private generateSignature(params: any): string {
    const data = JSON.stringify(params);
    return crypto.HmacSHA256(data, this.config.merchantKey).toString();
  }

  /**
   * Make API request to Payme
   */
  private async makeRequest(method: string, params: any, id: string): Promise<any> {
    const request = {
      method,
      params,
      id,
    };

    const signature = this.generateSignature(request);
    const headers = {
      'Content-Type': 'application/json',
      'X-Auth': `${this.config.merchantId}:${signature}`,
    };

    console.log(`\n🔍 Testing ${method}:`);
    console.log('Request:', JSON.stringify(request, null, 2));
    console.log('Headers:', JSON.stringify(headers, null, 2));

    const startTime = Date.now();
    try {
      const response = await axios.post(this.config.baseUrl, request, { headers });
      const responseTime = Date.now() - startTime;
      
      console.log('✅ Response:', JSON.stringify(response.data, null, 2));
      console.log(`⏱️  Response time: ${responseTime}ms`);
      
      return {
        success: true,
        data: response.data,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log('❌ Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        responseTime,
      };
    }
  }

  /**
   * Test 1: CheckPerformTransaction
   */
  async testCheckPerformTransaction(): Promise<TestResult> {
    const result = await this.makeRequest('CheckPerformTransaction', {
      account: {
        orderId: this.config.testOrderId,
      },
      amount: this.config.testAmount,
    }, 'test_1');

    return {
      testName: 'CheckPerformTransaction',
      success: result.success,
      error: result.error,
      data: result.data,
      responseTime: result.responseTime,
    };
  }

  /**
   * Test 2: CreateTransaction
   */
  async testCreateTransaction(): Promise<TestResult> {
    const result = await this.makeRequest('CreateTransaction', {
      id: `test_transaction_${Date.now()}`,
      account: {
        orderId: this.config.testOrderId,
      },
      amount: this.config.testAmount,
      time: Date.now(),
    }, 'test_2');

    return {
      testName: 'CreateTransaction',
      success: result.success,
      error: result.error,
      data: result.data,
      responseTime: result.responseTime,
    };
  }

  /**
   * Test 3: CheckTransaction
   */
  async testCheckTransaction(transactionId: string): Promise<TestResult> {
    const result = await this.makeRequest('CheckTransaction', {
      id: transactionId,
    }, 'test_3');

    return {
      testName: 'CheckTransaction',
      success: result.success,
      error: result.error,
      data: result.data,
      responseTime: result.responseTime,
    };
  }

  /**
   * Test 4: PerformTransaction
   */
  async testPerformTransaction(transactionId: string): Promise<TestResult> {
    const result = await this.makeRequest('PerformTransaction', {
      id: transactionId,
    }, 'test_4');

    return {
      testName: 'PerformTransaction',
      success: result.success,
      error: result.error,
      data: result.data,
      responseTime: result.responseTime,
    };
  }

  /**
   * Test 5: CancelTransaction
   */
  async testCancelTransaction(transactionId: string, reason: number = 1): Promise<TestResult> {
    const result = await this.makeRequest('CancelTransaction', {
      id: transactionId,
      reason,
    }, 'test_5');

    return {
      testName: 'CancelTransaction',
      success: result.success,
      error: result.error,
      data: result.data,
      responseTime: result.responseTime,
    };
  }

  /**
   * Test 6: GetStatement
   */
  async testGetStatement(): Promise<TestResult> {
    const from = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    const to = Date.now();

    const result = await this.makeRequest('GetStatement', {
      from,
      to,
    }, 'test_6');

    return {
      testName: 'GetStatement',
      success: result.success,
      error: result.error,
      data: result.data,
      responseTime: result.responseTime,
    };
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Payme Integration Tests...\n');
    console.log('Configuration:');
    console.log(`- Base URL: ${this.config.baseUrl}`);
    console.log(`- Merchant ID: ${this.config.merchantId ? 'SET' : 'NOT SET'}`);
    console.log(`- Merchant Key: ${this.config.merchantKey ? 'SET' : 'NOT SET'}`);
    console.log(`- Test Order ID: ${this.config.testOrderId}`);
    console.log(`- Test Amount: ${this.config.testAmount} tiyin (${this.config.testAmount / 100} UZS)\n`);

    // Test 1: CheckPerformTransaction
    const test1 = await this.testCheckPerformTransaction();
    this.results.push(test1);

    // Test 2: CreateTransaction
    const test2 = await this.testCreateTransaction();
    this.results.push(test2);

    let transactionId = null;
    if (test2.success && test2.data?.result?.transaction) {
      transactionId = test2.data.result.transaction;
      console.log(`\n📝 Transaction created with ID: ${transactionId}`);
    }

    // Test 3: CheckTransaction (if transaction was created)
    if (transactionId) {
      const test3 = await this.testCheckTransaction(transactionId);
      this.results.push(test3);

      // Test 4: PerformTransaction
      const test4 = await this.testPerformTransaction(transactionId);
      this.results.push(test4);

      // Test 5: CancelTransaction
      const test5 = await this.testCancelTransaction(transactionId);
      this.results.push(test5);
    }

    // Test 6: GetStatement
    const test6 = await this.testGetStatement();
    this.results.push(test6);

    this.printSummary();
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log('\n📊 Test Summary:');
    console.log('================');

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + (r.responseTime || 0), 0);

    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log(`📈 Average response time: ${Math.round(totalTime / this.results.length)}ms\n`);

    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
      console.log(`${status} ${result.testName}${time}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n🎯 Recommendations:');
    if (failed > 0) {
      console.log('- Check your Payme credentials and configuration');
      console.log('- Verify the API endpoint is correct');
      console.log('- Ensure your merchant account is active');
      console.log('- Check Payme documentation for error codes');
    } else {
      console.log('- All tests passed! Your Payme integration is working correctly');
      console.log('- You can now implement the payment flow in your application');
    }
  }
}

// Example usage
async function main() {
  // Configuration - Update these values with your actual credentials
  const config: TestConfig = {
    baseUrl: process.env.PAYME_API_URL || 'https://checkout.paycom.uz/api',
    merchantId: process.env.PAYME_MERCHANT_ID || 'YOUR_MERCHANT_ID',
    merchantKey: process.env.PAYME_MERCHANT_KEY || 'YOUR_MERCHANT_KEY',
    testOrderId: `test_order_${Date.now()}`,
    testAmount: 100000, // 1000 UZS in tiyin
  };

  // Validate configuration
  if (config.merchantId === 'YOUR_MERCHANT_ID' || config.merchantKey === 'YOUR_MERCHANT_KEY') {
    console.log('❌ Please set your Payme credentials in environment variables:');
    console.log('   PAYME_MERCHANT_ID=your_merchant_id');
    console.log('   PAYME_MERCHANT_KEY=your_merchant_key');
    console.log('   PAYME_API_URL=https://checkout.paycom.uz/api (optional)');
    process.exit(1);
  }

  const tester = new PaymeIntegrationTester(config);
  await tester.runAllTests();
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

export { PaymeIntegrationTester };
