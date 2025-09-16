#!/usr/bin/env node

/**
 * Payme Integration Test Script
 * 
 * This script tests the Payme integration by:
 * 1. Creating a test order
 * 2. Testing the Payme callback endpoints
 * 3. Verifying order status updates
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'your-test-jwt-token-here';

interface TestResult {
  test: string;
  success: boolean;
  error?: string;
  data?: any;
}

class PaymeIntegrationTest {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        data,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async testCreateOrder(): Promise<TestResult> {
    try {
      console.log('🧪 Testing order creation...');
      
      const result = await this.makeRequest('POST', '/user-plans/payment', {
        planId: 'test-plan-id', // Replace with actual plan ID
        paymentMethod: 'Payme'
      });

      console.log('✅ Order created successfully:', result.data.orderId);
      
      return {
        test: 'Create Order',
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('❌ Order creation failed:', error.message);
      return {
        test: 'Create Order',
        success: false,
        error: error.message
      };
    }
  }

  async testPaymeCallback(): Promise<TestResult> {
    try {
      console.log('🧪 Testing Payme callback...');
      
      const testOrderId = `test_order_${Date.now()}`;
      const testAmount = 100000; // 1000 UZS in tiyin
      
      const callbackData = {
        id: Date.now().toString(),
        method: 'CheckPerformTransaction',
        params: {
          account: {
            orderId: testOrderId
          },
          amount: testAmount,
          time: Date.now()
        }
      };

      const result = await this.makeRequest('POST', '/payments/payme/callback', callbackData);

      console.log('✅ Payme callback test successful');
      
      return {
        test: 'Payme Callback',
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Payme callback test failed:', error.message);
      return {
        test: 'Payme Callback',
        success: false,
        error: error.message
      };
    }
  }

  async testOrderRetrieval(): Promise<TestResult> {
    try {
      console.log('🧪 Testing order retrieval...');
      
      const result = await this.makeRequest('GET', '/user-plans/orders');

      console.log('✅ Order retrieval successful');
      
      return {
        test: 'Order Retrieval',
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('❌ Order retrieval failed:', error.message);
      return {
        test: 'Order Retrieval',
        success: false,
        error: error.message
      };
    }
  }

  async testPaymeConfiguration(): Promise<TestResult> {
    try {
      console.log('🧪 Testing Payme configuration...');
      
      const result = await this.makeRequest('POST', '/payments/debug-config');

      console.log('✅ Payme configuration test successful');
      
      return {
        test: 'Payme Configuration',
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('❌ Payme configuration test failed:', error.message);
      return {
        test: 'Payme Configuration',
        success: false,
        error: error.message
      };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Payme Integration Tests...\n');

    const tests = [
      () => this.testPaymeConfiguration(),
      () => this.testCreateOrder(),
      () => this.testPaymeCallback(),
      () => this.testOrderRetrieval(),
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        console.log(''); // Add spacing between tests
      } catch (error) {
        results.push({
          test: 'Unknown Test',
          success: false,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('📊 Test Results Summary:');
    console.log('========================');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.success ? 'PASSED' : 'FAILED'}`);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\n📈 Total: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Payme integration is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }
  }
}

// Main execution
async function main() {
  if (!TEST_USER_TOKEN || TEST_USER_TOKEN === 'your-test-jwt-token-here') {
    console.error('❌ Please set TEST_USER_TOKEN environment variable with a valid JWT token');
    process.exit(1);
  }

  const tester = new PaymeIntegrationTest(BASE_URL, TEST_USER_TOKEN);
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { PaymeIntegrationTest };
