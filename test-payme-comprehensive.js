#!/usr/bin/env node

const https = require("https");
const http = require("http");

// Test configuration
const BASE_URL = "http://localhost:4000";
const WEBHOOK_PATH = "/payments/payme/callback";

// Payme sandbox credentials
const MERCHANT_ID = "Paycom";
const MERCHANT_KEY = "zNp20vKdv&#8IdSaWkE2Kc#x7FJWCeFN2iKQ";

// Create authorization header
const authString = `${MERCHANT_ID}:${MERCHANT_KEY}`;
const authHeader = `Basic ${Buffer.from(authString).toString("base64")}`;

console.log("🔧 Payme Integration Test Suite");
console.log("================================");
console.log(`Base URL: ${BASE_URL}`);
console.log(`Webhook: ${WEBHOOK_PATH}`);
console.log(`Merchant ID: ${MERCHANT_ID}`);
console.log(`Auth Header: ${authHeader}`);
console.log("");

// Test cases based on Payme API documentation
const testCases = [
  {
    name: "CheckPerformTransaction - Valid Request",
    method: "CheckPerformTransaction",
    params: {
      amount: 1000000,
      account: { orderId: "valid-order-123" },
    },
    expectedError: null,
  },
  {
    name: "CheckPerformTransaction - Invalid Account",
    method: "CheckPerformTransaction",
    params: {
      amount: 1000000,
      account: { orderId: "bbb" },
    },
    expectedError: -31050,
  },
  {
    name: "CheckPerformTransaction - Invalid Amount",
    method: "CheckPerformTransaction",
    params: {
      amount: 1,
      account: { orderId: "valid-order-123" },
    },
    expectedError: -31001,
  },
  {
    name: "CreateTransaction - Valid Request",
    method: "CreateTransaction",
    params: {
      id: "test-transaction-123",
      time: Date.now(),
      amount: 1000000,
      account: { orderId: "valid-order-123" },
    },
    expectedError: null,
  },
  {
    name: "CreateTransaction - Invalid Account",
    method: "CreateTransaction",
    params: {
      id: "test-transaction-456",
      time: Date.now(),
      amount: 1000000,
      account: { orderId: "111" },
    },
    expectedError: -31050,
  },
  {
    name: "CreateTransaction - Invalid Amount",
    method: "CreateTransaction",
    params: {
      id: "test-transaction-789",
      time: Date.now(),
      amount: 999999999,
      account: { orderId: "valid-order-123" },
    },
    expectedError: -31001,
  },
  {
    name: "PerformTransaction - Valid Request",
    method: "PerformTransaction",
    params: {
      id: "test-transaction-123",
    },
    expectedError: null,
  },
  {
    name: "CheckTransaction - Valid Request",
    method: "CheckTransaction",
    params: {
      id: "test-transaction-123",
    },
    expectedError: null,
  },
  {
    name: "CancelTransaction - Valid Request",
    method: "CancelTransaction",
    params: {
      id: "test-transaction-123",
      reason: 1,
    },
    expectedError: null,
  },
  {
    name: "GetStatement - Valid Request",
    method: "GetStatement",
    params: {
      from: Date.now() - 86400000, // 24 hours ago
      to: Date.now(),
    },
    expectedError: null,
  },
];

// Function to make HTTP request
function makeRequest(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1000000),
      method: testCase.method,
      params: testCase.params,
    });

    const options = {
      hostname: "localhost",
      port: 4000,
      path: WEBHOOK_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            response: response,
            testCase: testCase,
          });
        } catch (error) {
          reject({
            error: error,
            data: data,
            testCase: testCase,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject({
        error: error,
        testCase: testCase,
      });
    });

    req.write(postData);
    req.end();
  });
}

// Function to run all tests
async function runTests() {
  console.log("🚀 Starting Payme Integration Tests...\n");

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: ${testCase.name}`);
      console.log(`   Method: ${testCase.method}`);
      console.log(`   Params: ${JSON.stringify(testCase.params)}`);

      const result = await makeRequest(testCase);

      if (result.statusCode === 200) {
        if (testCase.expectedError === null) {
          // Should succeed
          if (result.response.result && result.response.result.success) {
            console.log(`   ✅ PASS - Success response received`);
            passed++;
          } else if (result.response.error) {
            console.log(
              `   ❌ FAIL - Expected success but got error: ${result.response.error.code} - ${result.response.error.message}`
            );
            failed++;
          } else {
            console.log(
              `   ❌ FAIL - Unexpected response format: ${JSON.stringify(result.response)}`
            );
            failed++;
          }
        } else {
          // Should return specific error
          if (
            result.response.error &&
            result.response.error.code === testCase.expectedError
          ) {
            console.log(
              `   ✅ PASS - Correct error code ${testCase.expectedError} received`
            );
            passed++;
          } else {
            console.log(
              `   ❌ FAIL - Expected error ${testCase.expectedError} but got: ${JSON.stringify(result.response)}`
            );
            failed++;
          }
        }
      } else {
        console.log(
          `   ❌ FAIL - HTTP ${result.statusCode}: ${JSON.stringify(result.response)}`
        );
        failed++;
      }
    } catch (error) {
      console.log(
        `   ❌ FAIL - Request failed: ${error.error?.message || error.message}`
      );
      failed++;
    }

    console.log("");
  }

  console.log("📊 Test Results Summary");
  console.log("======================");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log(
      "\n🎉 All tests passed! Your Payme integration is working correctly."
    );
  } else {
    console.log("\n⚠️  Some tests failed. Please check the issues above.");
  }
}

// Run the tests
runTests().catch(console.error);
