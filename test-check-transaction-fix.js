const axios = require("axios");

// Test script specifically for CheckTransaction perform_time fix
const BASE_URL = "http://localhost:3000/api/payments/payme/callback";

// Test data - using the same transaction ID from your test
const testTransactionId = "68c9aad220cfb2025b9edc5c";

// Authorization header (you'll need to replace with actual credentials)
const authHeader =
  "Basic " + Buffer.from("merchant_id:merchant_key").toString("base64");

async function testCheckTransactionFix() {
  console.log("=== Testing CheckTransaction perform_time Fix ===\n");

  try {
    // Test CheckTransaction with the transaction ID from your test
    console.log("Checking transaction status for ID:", testTransactionId);

    const checkResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146441,
        method: "CheckTransaction",
        params: {
          id: testTransactionId,
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
      "CheckTransaction Response:",
      JSON.stringify(checkResponse.data, null, 2)
    );

    // Verify the fix
    if (checkResponse.data.result) {
      const result = checkResponse.data.result;
      console.log("\n=== Verification ===");
      console.log(`Transaction State: ${result.state}`);
      console.log(`Perform Time: ${result.perform_time}`);
      console.log(`Cancel Time: ${result.cancel_time}`);
      console.log(`Create Time: ${result.create_time}`);

      if (result.state === -2) {
        if (result.perform_time > 0) {
          console.log(
            "✅ SUCCESS: CANCELLED_AFTER_PERFORMED transaction has correct perform_time (not 0)"
          );
          console.log("   This matches the Payme specification requirement");
        } else {
          console.log(
            "❌ FAILED: CANCELLED_AFTER_PERFORMED transaction still has perform_time = 0"
          );
          console.log("   This was the bug that needed to be fixed");
        }
      } else if (result.state === -1) {
        if (result.perform_time === 0) {
          console.log(
            "✅ SUCCESS: CANCELLED transaction has correct perform_time = 0"
          );
        } else {
          console.log(
            "❌ FAILED: CANCELLED transaction should have perform_time = 0"
          );
        }
      } else if (result.state === 2) {
        if (result.perform_time > 0) {
          console.log(
            "✅ SUCCESS: PERFORMED transaction has correct perform_time"
          );
        } else {
          console.log(
            "❌ FAILED: PERFORMED transaction should have perform_time > 0"
          );
        }
      } else if (result.state === 1) {
        if (result.perform_time === 0) {
          console.log(
            "✅ SUCCESS: CREATED transaction has correct perform_time = 0"
          );
        } else {
          console.log(
            "❌ FAILED: CREATED transaction should have perform_time = 0"
          );
        }
      } else {
        console.log("⚠️  UNEXPECTED: Unknown transaction state:", result.state);
      }
    } else if (checkResponse.data.error) {
      console.log("❌ ERROR:", checkResponse.data.error);
    }
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testCheckTransactionFix();

