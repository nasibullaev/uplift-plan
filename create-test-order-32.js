const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3000/api/payments/payme/callback";
const MERCHANT_ID = "your_merchant_id"; // Replace with actual merchant ID
const MERCHANT_KEY = "your_merchant_key"; // Replace with actual merchant key

// Test order configuration
const TEST_ORDER_ID = "test_order_32";
const TEST_TRANSACTION_ID = "68c972fd20cfb2025b9edc32";
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

async function createTestOrder32() {
  console.log("Creating test_order_32...");

  try {
    // CreateTransaction
    const createParams = {
      jsonrpc: "2.0",
      id: 146501,
      method: "CreateTransaction",
      params: {
        id: TEST_TRANSACTION_ID,
        account: {
          orderId: TEST_ORDER_ID,
        },
        amount: TEST_AMOUNT,
        time: Date.now(),
      },
    };

    const authHeader = createAuthHeader(
      MERCHANT_ID,
      MERCHANT_KEY,
      createParams
    );

    const response = await axios.post(BASE_URL, createParams, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    console.log("Response:", JSON.stringify(response.data, null, 2));
    console.log("✅ test_order_32 created successfully!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// Run the script
if (require.main === module) {
  console.log("⚠️  Please update MERCHANT_ID and MERCHANT_KEY before running");
  console.log("⚠️  Make sure your server is running on localhost:3000\n");
  createTestOrder32();
}

module.exports = { createTestOrder32 };
