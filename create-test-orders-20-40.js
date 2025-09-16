/**
 * Script to create test orders from 20 to 40
 * This script creates test orders for Payme integration testing
 */

const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3000/api/payments/payme/callback";
const MERCHANT_ID = "your_merchant_id"; // Replace with actual merchant ID
const MERCHANT_KEY = "your_merchant_key"; // Replace with actual merchant key

// Test parameters
const START_ORDER = 20;
const END_ORDER = 40;
const TEST_AMOUNT = 100000; // 1000 UZS in tiyin

// Generate signature for Payme requests
function generateSignature(params, merchantKey) {
  const crypto = require("crypto");
  const data = JSON.stringify(params);
  return crypto.createHmac("sha256", merchantKey).update(data).digest("hex");
}

// Create authorization header
function createAuthHeader(merchantId, merchantKey, params) {
  const signature = generateSignature(params, merchantKey);
  const authString = `${merchantId}:${signature}`;
  const base64Auth = Buffer.from(authString).toString("base64");
  return `Basic ${base64Auth}`;
}

// Create a single test order
async function createTestOrder(orderNumber) {
  const orderId = `test_order_${orderNumber}`;

  console.log(`📝 Creating test order ${orderNumber} (${orderId})...`);

  try {
    // Step 1: CheckPerformTransaction
    console.log(`  🔍 Step 1: CheckPerformTransaction for ${orderId}`);
    const checkParams = {
      jsonrpc: "2.0",
      id: 1000 + orderNumber,
      method: "CheckPerformTransaction",
      params: {
        account: {
          orderId: orderId,
        },
        amount: TEST_AMOUNT,
      },
    };

    const authHeader1 = createAuthHeader(
      MERCHANT_ID,
      MERCHANT_KEY,
      checkParams
    );

    const response1 = await axios.post(BASE_URL, checkParams, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader1,
      },
    });

    console.log(
      `  📋 CheckPerformTransaction response:`,
      JSON.stringify(response1.data, null, 2)
    );

    if (!response1.data.result) {
      console.log(`  ❌ CheckPerformTransaction failed for ${orderId}`);
      return false;
    }

    // Step 2: CreateTransaction
    console.log(`  🏗️  Step 2: CreateTransaction for ${orderId}`);
    const createParams = {
      jsonrpc: "2.0",
      id: 2000 + orderNumber,
      method: "CreateTransaction",
      params: {
        id: `${orderId}_${Date.now()}`,
        time: Date.now(),
        amount: TEST_AMOUNT,
        account: {
          orderId: orderId,
        },
      },
    };

    const authHeader2 = createAuthHeader(
      MERCHANT_ID,
      MERCHANT_KEY,
      createParams
    );

    const response2 = await axios.post(BASE_URL, createParams, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader2,
      },
    });

    console.log(
      `  📋 CreateTransaction response:`,
      JSON.stringify(response2.data, null, 2)
    );

    if (!response2.data.result) {
      console.log(`  ❌ CreateTransaction failed for ${orderId}`);
      return false;
    }

    const transactionId = response2.data.result.transaction;
    console.log(`  ✅ Transaction created: ${transactionId}`);

    // Step 3: PerformTransaction
    console.log(`  ⚡ Step 3: PerformTransaction for ${transactionId}`);
    const performParams = {
      jsonrpc: "2.0",
      id: 3000 + orderNumber,
      method: "PerformTransaction",
      params: {
        id: transactionId,
      },
    };

    const authHeader3 = createAuthHeader(
      MERCHANT_ID,
      MERCHANT_KEY,
      performParams
    );

    const response3 = await axios.post(BASE_URL, performParams, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader3,
      },
    });

    console.log(
      `  📋 PerformTransaction response:`,
      JSON.stringify(response3.data, null, 2)
    );

    if (!response3.data.result) {
      console.log(`  ❌ PerformTransaction failed for ${transactionId}`);
      return false;
    }

    console.log(`  ✅ Order ${orderNumber} (${orderId}) created successfully!`);
    console.log(`  📊 Transaction ID: ${transactionId}`);
    console.log(`  💰 Amount: ${TEST_AMOUNT} tiyin (${TEST_AMOUNT / 100} UZS)`);
    console.log(`  📅 Created at: ${new Date().toISOString()}\n`);

    return {
      orderNumber,
      orderId,
      transactionId,
      amount: TEST_AMOUNT,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `  ❌ Error creating order ${orderNumber}:`,
      error.response?.data || error.message
    );
    return false;
  }
}

// Create all test orders
async function createAllTestOrders() {
  console.log(
    `🚀 Creating test orders from ${START_ORDER} to ${END_ORDER}...\n`
  );

  const results = [];
  const errors = [];

  for (let orderNumber = START_ORDER; orderNumber <= END_ORDER; orderNumber++) {
    const result = await createTestOrder(orderNumber);

    if (result) {
      results.push(result);
    } else {
      errors.push(orderNumber);
    }

    // Add a small delay between orders to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Summary
  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Successfully created: ${results.length} orders`);
  console.log(`❌ Failed to create: ${errors.length} orders`);

  if (errors.length > 0) {
    console.log(`❌ Failed order numbers: ${errors.join(", ")}`);
  }

  if (results.length > 0) {
    console.log(`\n📋 Created Orders:`);
    results.forEach((result) => {
      console.log(
        `  ${result.orderNumber}: ${result.orderId} (${result.transactionId})`
      );
    });
  }

  return { results, errors };
}

// Run the script
if (require.main === module) {
  console.log(
    "⚠️  Please update MERCHANT_ID and MERCHANT_KEY in this script before running"
  );
  console.log("⚠️  Make sure your server is running on localhost:3000");
  console.log("⚠️  This script will create orders from 20 to 40\n");

  createAllTestOrders()
    .then(({ results, errors }) => {
      if (errors.length === 0) {
        console.log("\n🎉 All test orders created successfully!");
      } else {
        console.log(
          `\n⚠️  ${errors.length} orders failed to create. Check the logs above.`
        );
      }
    })
    .catch((error) => {
      console.error("❌ Script failed:", error.message);
    });
}

module.exports = { createTestOrder, createAllTestOrders };
