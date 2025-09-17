#!/usr/bin/env node

/**
 * Test script to verify that CheckPerformTransaction and CreateTransaction
 * properly validate orderId first before amount validation
 */

const axios = require("axios");

// Test script to verify orderId validation order
const BASE_URL = "http://localhost:3000/api/payments/payme/callback";

// Authorization header (you'll need to replace with actual credentials)
const authHeader =
  "Basic " + Buffer.from("merchant_id:merchant_key").toString("base64");

async function testInvalidOrderId() {
  console.log("=== Testing Invalid OrderId Validation Order ===\n");

  const invalidOrderId = "teststs"; // Non-existent order ID
  const testAmount = 1000000; // Some amount

  try {
    // Test 1: CheckPerformTransaction with invalid orderId
    console.log("1. Testing CheckPerformTransaction with invalid orderId...");
    console.log(`   Order ID: ${invalidOrderId}`);
    console.log(`   Amount: ${testAmount}`);

    const checkPerformResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 148522,
        method: "CheckPerformTransaction",
        params: {
          amount: testAmount,
          account: {
            orderId: invalidOrderId,
          },
        },
      },
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("CheckPerformTransaction Response:");
    console.log(JSON.stringify(checkPerformResponse.data, null, 2));

    // Check if we get the correct error for invalid orderId
    if (checkPerformResponse.data.error) {
      const errorCode = checkPerformResponse.data.error.code;
      const errorMessage = checkPerformResponse.data.error.message;

      console.log(`\n✅ CheckPerformTransaction Error Analysis:`);
      console.log(`   Error Code: ${errorCode}`);
      console.log(`   Error Message: ${errorMessage}`);

      if (
        errorMessage === "Order not found" ||
        errorMessage === "Missing orderId"
      ) {
        console.log(
          `   ✅ SUCCESS: OrderId validation happens before amount validation`
        );
      } else if (errorMessage === "Invalid amount") {
        console.log(
          `   ❌ FAILED: Amount validation happens before orderId validation`
        );
      } else {
        console.log(`   ⚠️  UNEXPECTED: Unknown error message`);
      }
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 2: CreateTransaction with invalid orderId
    console.log("2. Testing CreateTransaction with invalid orderId...");
    console.log(`   Order ID: ${invalidOrderId}`);
    console.log(`   Amount: ${testAmount}`);

    const createResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 148523,
        method: "CreateTransaction",
        params: {
          id: "68caaf9820cfb2025b9edec2",
          time: Date.now(),
          amount: testAmount,
          account: {
            orderId: invalidOrderId,
          },
        },
      },
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("CreateTransaction Response:");
    console.log(JSON.stringify(createResponse.data, null, 2));

    // Check if we get the correct error for invalid orderId
    if (createResponse.data.error) {
      const errorCode = createResponse.data.error.code;
      const errorMessage = createResponse.data.error.message;

      console.log(`\n✅ CreateTransaction Error Analysis:`);
      console.log(`   Error Code: ${errorCode}`);
      console.log(`   Error Message: ${errorMessage}`);

      if (
        errorMessage === "Order not found" ||
        errorMessage === "Missing orderId"
      ) {
        console.log(
          `   ✅ SUCCESS: OrderId validation happens before amount validation`
        );
      } else if (errorMessage === "Invalid amount") {
        console.log(
          `   ❌ FAILED: Amount validation happens before orderId validation`
        );
      } else {
        console.log(`   ⚠️  UNEXPECTED: Unknown error message`);
      }
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 3: Test with valid orderId but invalid amount for comparison
    console.log(
      "3. Testing with valid orderId but invalid amount for comparison..."
    );
    const validOrderId = "test_order_36"; // This should exist
    const invalidAmount = 999999999; // Very large amount that doesn't match order

    const checkValidOrderResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 148524,
        method: "CheckPerformTransaction",
        params: {
          amount: invalidAmount,
          account: {
            orderId: validOrderId,
          },
        },
      },
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "CheckPerformTransaction Response (valid order, invalid amount):"
    );
    console.log(JSON.stringify(checkValidOrderResponse.data, null, 2));

    if (checkValidOrderResponse.data.error) {
      const errorMessage = checkValidOrderResponse.data.error.message;
      console.log(`\n✅ Valid Order + Invalid Amount Error Analysis:`);
      console.log(`   Error Message: ${errorMessage}`);

      if (errorMessage === "Invalid amount") {
        console.log(
          `   ✅ SUCCESS: Amount validation works correctly for valid orders`
        );
      } else {
        console.log(`   ⚠️  UNEXPECTED: ${errorMessage}`);
      }
    }

    console.log("\n=== Test Summary ===");
    console.log("The validation order should be:");
    console.log("1. Check if orderId is provided");
    console.log("2. Check if order exists in system");
    console.log("3. Check if amount is valid");
    console.log("4. Check if amount matches order amount");
    console.log(
      "\nThis ensures proper error codes according to Payme specification."
    );
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testInvalidOrderId();
