/**
 * Simple script to create test order records from 20 to 40
 * This creates order records directly in the database without Payme integration
 */

const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3000"; // Your API base URL
const JWT_TOKEN = "your_jwt_token"; // Replace with actual JWT token

// Test parameters
const START_ORDER = 20;
const END_ORDER = 40;
const TEST_PLAN_ID = "your_plan_id"; // Replace with actual plan ID

// Create a single test order record
async function createTestOrderRecord(orderNumber) {
  const orderId = `test_order_${orderNumber}`;

  console.log(`📝 Creating test order record ${orderNumber} (${orderId})...`);

  try {
    // Create order via your API endpoint
    const orderData = {
      planId: TEST_PLAN_ID,
      amount: 1000, // 1000 UZS
      description: `Test order ${orderNumber} for Payme integration testing`,
      status: "PENDING",
      orderId: orderId,
    };

    const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    });

    console.log(`  ✅ Order ${orderNumber} (${orderId}) created successfully!`);
    console.log(`  📊 Order ID: ${response.data._id || response.data.id}`);
    console.log(`  💰 Amount: ${orderData.amount} UZS`);
    console.log(`  📅 Created at: ${new Date().toISOString()}\n`);

    return {
      orderNumber,
      orderId,
      orderId: response.data._id || response.data.id,
      amount: orderData.amount,
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

// Create all test order records
async function createAllTestOrderRecords() {
  console.log(
    `🚀 Creating test order records from ${START_ORDER} to ${END_ORDER}...\n`
  );

  const results = [];
  const errors = [];

  for (let orderNumber = START_ORDER; orderNumber <= END_ORDER; orderNumber++) {
    const result = await createTestOrderRecord(orderNumber);

    if (result) {
      results.push(result);
    } else {
      errors.push(orderNumber);
    }

    // Add a small delay between orders
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Summary
  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Successfully created: ${results.length} order records`);
  console.log(`❌ Failed to create: ${errors.length} order records`);

  if (errors.length > 0) {
    console.log(`❌ Failed order numbers: ${errors.join(", ")}`);
  }

  if (results.length > 0) {
    console.log(`\n📋 Created Order Records:`);
    results.forEach((result) => {
      console.log(
        `  ${result.orderNumber}: ${result.orderId} (${result.orderId})`
      );
    });
  }

  return { results, errors };
}

// Run the script
if (require.main === module) {
  console.log(
    "⚠️  Please update JWT_TOKEN and TEST_PLAN_ID in this script before running"
  );
  console.log("⚠️  Make sure your server is running");
  console.log("⚠️  This script will create order records from 20 to 40\n");

  createAllTestOrderRecords()
    .then(({ results, errors }) => {
      if (errors.length === 0) {
        console.log("\n🎉 All test order records created successfully!");
      } else {
        console.log(
          `\n⚠️  ${errors.length} order records failed to create. Check the logs above.`
        );
      }
    })
    .catch((error) => {
      console.error("❌ Script failed:", error.message);
    });
}

module.exports = { createTestOrderRecord, createAllTestOrderRecords };
