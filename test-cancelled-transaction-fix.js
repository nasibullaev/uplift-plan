/**
 * Test script to verify PerformTransaction and CheckTransaction fixes for cancelled transactions
 * This script demonstrates the expected behavior for cancelled transaction test cases
 */

const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3000/api/payments/payme/callback";
const MERCHANT_ID = "your_merchant_id"; // Replace with actual merchant ID
const MERCHANT_KEY = "your_merchant_key"; // Replace with actual merchant key

// Test transaction ID (should be a cancelled transaction ID from your database)
const TEST_TRANSACTION_ID = "68c9758b20cfb2025b9edc17";

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

async function testCancelledTransaction() {
  console.log("🧪 Testing cancelled transaction behavior...\n");

  try {
    // Test 1: PerformTransaction on cancelled transaction (should return error -31008)
    console.log(
      "1️⃣ PerformTransaction on cancelled transaction (should return error -31008)"
    );
    const performParams = {
      jsonrpc: "2.0",
      id: 146249,
      method: "PerformTransaction",
      params: {
        id: TEST_TRANSACTION_ID,
      },
    };

    const authHeader1 = createAuthHeader(
      MERCHANT_ID,
      MERCHANT_KEY,
      performParams
    );

    const response1 = await axios.post(BASE_URL, performParams, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader1,
      },
    });

    console.log("Response 1:", JSON.stringify(response1.data, null, 2));

    // Expected: Should return error -31008
    if (response1.data.error && response1.data.error.code === -31008) {
      console.log(
        "✅ PerformTransaction correctly returned error -31008 for cancelled transaction"
      );
    } else {
      console.log(
        "❌ PerformTransaction failed - expected error -31008, got:",
        response1.data.error?.code || "success result"
      );
    }

    console.log("\n2️⃣ CheckTransaction on cancelled transaction");

    // Test 2: CheckTransaction on cancelled transaction
    const checkParams = {
      jsonrpc: "2.0",
      id: 146250,
      method: "CheckTransaction",
      params: {
        id: TEST_TRANSACTION_ID,
      },
    };

    const authHeader2 = createAuthHeader(
      MERCHANT_ID,
      MERCHANT_KEY,
      checkParams
    );

    const response2 = await axios.post(BASE_URL, checkParams, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader2,
      },
    });

    console.log("Response 2:", JSON.stringify(response2.data, null, 2));

    // Expected values for cancelled transaction:
    // - perform_time: 0
    // - cancel_time: timestamp in milliseconds
    // - state: -1 (CANCELLED)
    // - reason: 3 (TRANSACTION_ERROR)
    if (response2.data.result) {
      const result = response2.data.result;
      let allCorrect = true;

      if (result.perform_time !== 0) {
        console.log(`❌ perform_time should be 0, got: ${result.perform_time}`);
        allCorrect = false;
      } else {
        console.log("✅ perform_time is 0");
      }

      if (!result.cancel_time || typeof result.cancel_time !== "number") {
        console.log(
          `❌ cancel_time should be timestamp in milliseconds, got: ${result.cancel_time}`
        );
        allCorrect = false;
      } else {
        console.log(`✅ cancel_time is timestamp: ${result.cancel_time}`);
      }

      if (result.state !== -1) {
        console.log(`❌ state should be -1 (CANCELLED), got: ${result.state}`);
        allCorrect = false;
      } else {
        console.log("✅ state is -1 (CANCELLED)");
      }

      if (result.reason !== 3) {
        console.log(
          `❌ reason should be 3 (TRANSACTION_ERROR), got: ${result.reason}`
        );
        allCorrect = false;
      } else {
        console.log("✅ reason is 3 (TRANSACTION_ERROR)");
      }

      if (allCorrect) {
        console.log("\n🎉 All CheckTransaction values are correct!");
      } else {
        console.log("\n❌ Some CheckTransaction values are incorrect");
      }
    } else {
      console.log("❌ CheckTransaction failed - no result returned");
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
  console.log(
    "⚠️  Make sure TEST_TRANSACTION_ID is a cancelled transaction in your database"
  );
  console.log("⚠️  Make sure your server is running on localhost:3000\n");

  testCancelledTransaction();
}

module.exports = { testCancelledTransaction };
