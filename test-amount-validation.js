#!/usr/bin/env node

/**
 * Test Amount Validation Script
 * 
 * This script tests the CheckPerformTransaction method to verify
 * that it properly validates amounts against order amounts.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './dist/app.module.js';
import { PaymeService } from './dist/payment/payme.service.js';

async function testAmountValidation() {
  console.log('🧪 Testing amount validation in CheckPerformTransaction...');
  
  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    const paymeService = app.get(PaymeService);
    
    // Test with test_order_22 (amount: 3000 UZS = 300,000 tiyin)
    const testOrderId = 'test_order_22';
    const correctAmount = 300000; // 3000 UZS in tiyin
    const incorrectAmount = 5000000; // 50,000 UZS in tiyin (should be rejected)
    
    console.log(`📝 Testing with order: ${testOrderId}`);
    console.log(`   Correct amount: ${correctAmount} tiyin (${correctAmount/100} UZS)`);
    console.log(`   Incorrect amount: ${incorrectAmount} tiyin (${incorrectAmount/100} UZS)`);
    
    // Test 1: Correct amount should pass
    console.log('\n🔄 Test 1: Correct amount validation...');
    const correctResult = await paymeService.handleCallback({
      method: 'CheckPerformTransaction',
      params: {
        amount: correctAmount,
        account: { orderId: testOrderId }
      }
    });
    
    console.log('📋 Correct Amount Result:');
    console.log(JSON.stringify(correctResult, null, 2));
    
    // Test 2: Incorrect amount should fail
    console.log('\n🔄 Test 2: Incorrect amount validation...');
    const incorrectResult = await paymeService.handleCallback({
      method: 'CheckPerformTransaction',
      params: {
        amount: incorrectAmount,
        account: { orderId: testOrderId }
      }
    });
    
    console.log('📋 Incorrect Amount Result:');
    console.log(JSON.stringify(incorrectResult, null, 2));
    
    // Test 3: Very small amount should fail
    console.log('\n🔄 Test 3: Very small amount validation...');
    const smallAmountResult = await paymeService.handleCallback({
      method: 'CheckPerformTransaction',
      params: {
        amount: 500, // 5 UZS in tiyin (below minimum)
        account: { orderId: testOrderId }
      }
    });
    
    console.log('📋 Small Amount Result:');
    console.log(JSON.stringify(smallAmountResult, null, 2));
    
    // Test 4: Very large amount should fail
    console.log('\n🔄 Test 4: Very large amount validation...');
    const largeAmountResult = await paymeService.handleCallback({
      method: 'CheckPerformTransaction',
      params: {
        amount: 200000000, // 2,000,000 UZS in tiyin (above maximum)
        account: { orderId: testOrderId }
      }
    });
    
    console.log('📋 Large Amount Result:');
    console.log(JSON.stringify(largeAmountResult, null, 2));
    
    // Verify the results
    console.log('\n🔍 Verification:');
    
    // Check correct amount
    if (correctResult.success && correctResult.result?.allow === true) {
      console.log('✅ Correct amount validation: PASSED');
    } else {
      console.log('❌ Correct amount validation: FAILED');
    }
    
    // Check incorrect amount
    if (!incorrectResult.success && incorrectResult.error === 'Invalid amount') {
      console.log('✅ Incorrect amount validation: PASSED');
    } else {
      console.log('❌ Incorrect amount validation: FAILED');
    }
    
    // Check small amount
    if (!smallAmountResult.success && smallAmountResult.error === 'Invalid amount') {
      console.log('✅ Small amount validation: PASSED');
    } else {
      console.log('❌ Small amount validation: FAILED');
    }
    
    // Check large amount
    if (!largeAmountResult.success && largeAmountResult.error === 'Invalid amount') {
      console.log('✅ Large amount validation: PASSED');
    } else {
      console.log('❌ Large amount validation: FAILED');
    }
    
    // Close the application context
    await app.close();
    
    console.log('\n🎉 Amount validation test completed!');
    
  } catch (error) {
    console.error('❌ Error testing amount validation:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
testAmountValidation().catch(console.error);

export { testAmountValidation };

