#!/usr/bin/env node

/**
 * Simple Payme Test Runner
 *
 * This script provides an easy way to test your Payme integration
 * without needing to set up the full NestJS application.
 */

const axios = require("axios");
const crypto = require("crypto-js");

// Configuration
const config = {
  baseUrl: process.env.PAYME_API_URL || "https://checkout.paycom.uz/api",
  merchantId: process.env.PAYME_MERCHANT_ID,
  merchantKey: process.env.PAYME_MERCHANT_KEY,
  testOrderId: `test_order_${Date.now()}`,
  testAmount: 100000, // 1000 UZS in tiyin
};

// Validate configuration
if (!config.merchantId || !config.merchantKey) {
  console.log("❌ Missing Payme credentials!");
  console.log("Please set the following environment variables:");
  console.log("  PAYME_MERCHANT_ID=your_merchant_id");
  console.log("  PAYME_MERCHANT_KEY=your_merchant_key");
  console.log("  PAYME_API_URL=https://checkout.paycom.uz/api (optional)");
  process.exit(1);
}

// Generate signature
function generateSignature(params) {
  const data = JSON.stringify(params);
  return crypto.HmacSHA256(data, config.merchantKey).toString();
}

// Make API request
async function makeRequest(method, params, id) {
  const request = {
    method,
    params,
    id,
  };

  const signature = generateSignature(request);
  const headers = {
    "Content-Type": "application/json",
    "X-Auth": `${config.merchantId}:${signature}`,
  };

  console.log(`\n🔍 Testing ${method}:`);
  console.log("Request:", JSON.stringify(request, null, 2));

  try {
    const response = await axios.post(config.baseUrl, request, { headers });
    console.log("✅ Response:", JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data };
  } catch (error) {
    console.log("❌ Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

// Run tests
async function runTests() {
  console.log("🚀 Starting Payme Integration Tests...\n");
  console.log("Configuration:");
  console.log(`- Base URL: ${config.baseUrl}`);
  console.log(`- Merchant ID: ${config.merchantId ? "SET" : "NOT SET"}`);
  console.log(`- Merchant Key: ${config.merchantKey ? "SET" : "NOT SET"}`);
  console.log(`- Test Order ID: ${config.testOrderId}`);
  console.log(
    `- Test Amount: ${config.testAmount} tiyin (${config.testAmount / 100} UZS)\n`
  );

  const results = [];

  // Test 1: CheckPerformTransaction
  const test1 = await makeRequest(
    "CheckPerformTransaction",
    {
      account: {
        orderId: config.testOrderId,
      },
      amount: config.testAmount,
    },
    "test_1"
  );
  results.push({ name: "CheckPerformTransaction", ...test1 });

  // Test 2: CreateTransaction
  const test2 = await makeRequest(
    "CreateTransaction",
    {
      id: `test_transaction_${Date.now()}`,
      account: {
        orderId: config.testOrderId,
      },
      amount: config.testAmount,
      time: Date.now(),
    },
    "test_2"
  );
  results.push({ name: "CreateTransaction", ...test2 });

  let transactionId = null;
  if (test2.success && test2.data?.result?.transaction) {
    transactionId = test2.data.result.transaction;
    console.log(`\n📝 Transaction created with ID: ${transactionId}`);
  }

  // Test 3: CheckTransaction (if transaction was created)
  if (transactionId) {
    const test3 = await makeRequest(
      "CheckTransaction",
      {
        id: transactionId,
      },
      "test_3"
    );
    results.push({ name: "CheckTransaction", ...test3 });

    // Test 4: PerformTransaction
    const test4 = await makeRequest(
      "PerformTransaction",
      {
        id: transactionId,
      },
      "test_4"
    );
    results.push({ name: "PerformTransaction", ...test4 });

    // Test 5: CancelTransaction
    const test5 = await makeRequest(
      "CancelTransaction",
      {
        id: transactionId,
        reason: 1,
      },
      "test_5"
    );
    results.push({ name: "CancelTransaction", ...test5 });
  }

  // Test 6: GetStatement
  const test6 = await makeRequest(
    "GetStatement",
    {
      from: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      to: Date.now(),
    },
    "test_6"
  );
  results.push({ name: "GetStatement", ...test6 });

  // Print summary
  console.log("\n📊 Test Summary:");
  console.log("================");

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    console.log(`${status} ${result.name}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log("\n🎯 Recommendations:");
  if (failed > 0) {
    console.log("- Check your Payme credentials and configuration");
    console.log("- Verify the API endpoint is correct");
    console.log("- Ensure your merchant account is active");
    console.log("- Check Payme documentation for error codes");
  } else {
    console.log(
      "- All tests passed! Your Payme integration is working correctly"
    );
    console.log("- You can now implement the payment flow in your application");
  }
}

// Run the tests
runTests().catch(console.error);
