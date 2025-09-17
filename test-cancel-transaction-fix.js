/**
 * Test script to verify CancelTransaction fix
 * This script demonstrates the expected behavior for the Payme CancelTransaction test case
 */

const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3000/api/payments/payme/callback";
const MERCHANT_ID = "your_merchant_id"; // Replace with actual merchant ID
const MERCHANT_KEY = "your_merchant_key"; // Replace with actual merchant key

// Test transaction ID (should be a real transaction ID from your database)
const TEST_TRANSACTION_ID = "68c972fd20cfb2025b9edc0c";

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

async function testCancelTransaction() {
  console.log("🧪 Testing CancelTransaction method...\n");

  try {
    // Test 1: Cancel transaction with reason 5 (REFUND)
    console.log("1️⃣ First CancelTransaction call (reason 5 - REFUND)");
    const cancelParams1 = {
      jsonrpc: "2.0",
      id: 146226,
      method: "CancelTransaction",
      params: {
        id: TEST_TRANSACTION_ID,
        reason: 5,
      },
    };

    const authHeader1 = createAuthHeader(
      MERCHANT_ID,
      MERCHANT_KEY,
      cancelParams1
    );

    const response1 = await axios.post(BASE_URL, cancelParams1, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader1,
      },
    });

    console.log("Response 1:", JSON.stringify(response1.data, null, 2));

    // Expected: state should be -2 (CANCELLED_AFTER_PERFORMED)
    if (response1.data.result && response1.data.result.state === -2) {
      console.log(
        "✅ First cancel call successful - transaction cancelled with state -2"
      );
    } else {
      console.log(
        "❌ First cancel call failed - unexpected state:",
        response1.data.result?.state
      );
    }

    console.log("\n2️⃣ Second CancelTransaction call (idempotency test)");

    // Test 2: Repeat the same cancel request (should return same result)
    const cancelParams2 = {
      jsonrpc: "2.0",
      id: 146227,
      method: "CancelTransaction",
      params: {
        id: TEST_TRANSACTION_ID,
        reason: 5,
      },
    };

    const authHeader2 = createAuthHeader(
      MERCHANT_ID,
      MERCHANT_KEY,
      cancelParams2
    );

    const response2 = await axios.post(BASE_URL, cancelParams2, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader2,
      },
    });

    console.log("Response 2:", JSON.stringify(response2.data, null, 2));

    // Expected: same result as first call (idempotency)
    if (
      response1.data.result &&
      response2.data.result &&
      response1.data.result.cancel_time === response2.data.result.cancel_time &&
      response1.data.result.state === response2.data.result.state
    ) {
      console.log(
        "✅ Second cancel call successful - idempotency working correctly"
      );
    } else {
      console.log("❌ Second cancel call failed - idempotency not working");
    }

    console.log("\n3️⃣ CheckTransaction call (verify perform_time is 0)");

    // Test 3: Check transaction status
    const checkParams = {
      jsonrpc: "2.0",
      id: 146228,
      method: "CheckTransaction",
      params: {
        id: TEST_TRANSACTION_ID,
      },
    };

    const authHeader3 = createAuthHeader(
      MERCHANT_ID,
      MERCHANT_KEY,
      checkParams
    );

    const response3 = await axios.post(BASE_URL, checkParams, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader3,
      },
    });

    console.log("Response 3:", JSON.stringify(response3.data, null, 2));

    // Expected: perform_time should be 0 for cancelled transactions
    if (response3.data.result && response3.data.result.perform_time === 0) {
      console.log(
        "✅ CheckTransaction successful - perform_time is 0 as expected"
      );
    } else {
      console.log(
        "❌ CheckTransaction failed - perform_time should be 0, got:",
        response3.data.result?.perform_time
      );
    }

    console.log("\n🎉 Test completed!");
  } catch (error) {
    console.error(
      "❌ Test failed with error:",
      error.response?.data || error.message
    );
  }
}

// Run the test
if (require.main === module) {
  console.log(
    "⚠️  Please update MERCHANT_ID and MERCHANT_KEY in this script before running"
  );
  console.log("⚠️  Make sure TEST_TRANSACTION_ID exists in your database");
  console.log("⚠️  Make sure your server is running on localhost:3000\n");

  testCancelTransaction();
}

module.exports = { testCancelTransaction };
