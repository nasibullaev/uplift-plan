const axios = require("axios");

// Test script to create order_31 for Payme testing
const BASE_URL = "http://localhost:3000/api/payments/payme/callback";

// Test data for order_31
const testOrderId = "order_31";
const testTransactionId = "68c9aad220cfb2025b9edc5d"; // Different ID for order_31

// Authorization header (you'll need to replace with actual credentials)
const authHeader =
  "Basic " + Buffer.from("merchant_id:merchant_key").toString("base64");

async function createTestOrder31() {
  console.log("=== Creating Test Order 31 ===\n");

  try {
    // Step 1: Check if order_31 can be performed
    console.log("1. Checking if order_31 can be performed...");
    const checkPerformResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146450,
        method: "CheckPerformTransaction",
        params: {
          account: {
            orderId: testOrderId,
          },
          amount: 100000, // 1000 UZS in tiyin
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
      "CheckPerformTransaction Response:",
      JSON.stringify(checkPerformResponse.data, null, 2)
    );

    // Step 2: Create transaction for order_31
    console.log("\n2. Creating transaction for order_31...");
    const createResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146451,
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

    // Step 3: Perform the transaction
    console.log("\n3. Performing transaction for order_31...");
    const performResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146452,
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

    // Step 4: Check transaction status
    console.log("\n4. Checking transaction status...");
    const checkResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146453,
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

    // Step 5: Cancel the transaction (reason 5 = REFUND)
    console.log("\n5. Cancelling transaction for order_31...");
    const cancelResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146454,
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

    // Step 6: Final check to verify the fix
    console.log(
      "\n6. Final verification - checking transaction after cancellation..."
    );
    const finalCheckResponse = await axios.post(
      BASE_URL,
      {
        jsonrpc: "2.0",
        id: 146455,
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
      "Final CheckTransaction Response:",
      JSON.stringify(finalCheckResponse.data, null, 2)
    );

    // Verify the fix
    if (finalCheckResponse.data.result) {
      const result = finalCheckResponse.data.result;
      console.log("\n=== Final Verification ===");
      console.log(`Order ID: ${testOrderId}`);
      console.log(`Transaction ID: ${testTransactionId}`);
      console.log(`Transaction State: ${result.state}`);
      console.log(`Perform Time: ${result.perform_time}`);
      console.log(`Cancel Time: ${result.cancel_time}`);
      console.log(`Create Time: ${result.create_time}`);

      if (result.state === -2 && result.perform_time > 0) {
        console.log(
          "✅ SUCCESS: order_31 CANCELLED_AFTER_PERFORMED transaction has correct perform_time"
        );
        console.log("   The fix is working correctly!");
      } else if (result.state === -2 && result.perform_time === 0) {
        console.log(
          "❌ FAILED: order_31 CANCELLED_AFTER_PERFORMED transaction still has perform_time = 0"
        );
        console.log("   The fix needs more work");
      } else {
        console.log("⚠️  UNEXPECTED: order_31 transaction state is not -2");
      }
    }

    console.log("\n=== Test Order 31 Creation Complete ===");
    console.log(`Order ID: ${testOrderId}`);
    console.log(`Transaction ID: ${testTransactionId}`);
    console.log("You can now use this order for Payme testing");
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

// Run the test
createTestOrder31();
