const axios = require("axios");

// Test script for CancelTransaction method fix
const BASE_URL = "http://localhost:3000/api/payments/payme/callback";

// Test data
const testTransactionId = "68c9aad220cfb2025b9edc5c";
const testOrderId = "order_test_123";

// Authorization header (you'll need to replace with actual credentials)
const authHeader =
  "Basic " + Buffer.from("merchant_id:merchant_key").toString("base64");

async function testCancelTransaction() {
  console.log("=== Testing CancelTransaction Method ===\n");

  try {
    // Step 1: Create a transaction first
    console.log("1. Creating transaction...");
    const createResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146435,
        method: "CreateTransaction",
        params: {
          id: testTransactionId,
          account: {
            orderId: testOrderId,
          },
          amount: 100000, // 1000 UZS in tiyin
          time: Date.now(),
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
      "CreateTransaction Response:",
      JSON.stringify(createResponse.data, null, 2)
    );

    // Step 2: Perform the transaction
    console.log("\n2. Performing transaction...");
    const performResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146436,
        method: "PerformTransaction",
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
      "PerformTransaction Response:",
      JSON.stringify(performResponse.data, null, 2)
    );

    // Step 3: Cancel the transaction (reason 5 = REFUND)
    console.log("\n3. Cancelling transaction with reason 5 (REFUND)...");
    const cancelResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146437,
        method: "CancelTransaction",
        params: {
          id: testTransactionId,
          reason: 5,
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
      "CancelTransaction Response:",
      JSON.stringify(cancelResponse.data, null, 2)
    );

    // Step 4: Check transaction status
    console.log("\n4. Checking transaction status...");
    const checkResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146438,
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

      if (result.state === -2 && result.perform_time > 0) {
        console.log(
          "✅ SUCCESS: CANCELLED_AFTER_PERFORMED transaction has correct perform_time"
        );
      } else if (result.state === -2 && result.perform_time === 0) {
        console.log(
          "❌ FAILED: CANCELLED_AFTER_PERFORMED transaction has perform_time = 0 (this was the bug)"
        );
      } else {
        console.log("⚠️  UNEXPECTED: Transaction state is not -2");
      }
    }

    // Step 5: Test idempotency - cancel the same transaction again
    console.log(
      "\n5. Testing idempotency - cancelling same transaction again..."
    );
    const cancelAgainResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146439,
        method: "CancelTransaction",
        params: {
          id: testTransactionId,
          reason: 5,
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
      "CancelTransaction (idempotency) Response:",
      JSON.stringify(cancelAgainResponse.data, null, 2)
    );

    // Verify idempotency
    if (cancelAgainResponse.data.result && cancelResponse.data.result) {
      const firstCancel = cancelResponse.data.result;
      const secondCancel = cancelAgainResponse.data.result;

      if (
        firstCancel.cancel_time === secondCancel.cancel_time &&
        firstCancel.state === secondCancel.state
      ) {
        console.log("✅ SUCCESS: CancelTransaction is idempotent");
      } else {
        console.log("❌ FAILED: CancelTransaction is not idempotent");
      }
    }
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testCancelTransaction();
