#!/usr/bin/env node

const http = require("http");

// Test configuration
const BASE_URL = "http://localhost:4000";
const WEBHOOK_PATH = "/payments/payme/callback";

console.log("🔐 Payme Authorization Validation Test");
console.log("=====================================");
console.log(`Base URL: ${BASE_URL}`);
console.log(`Webhook: ${WEBHOOK_PATH}`);
console.log("");

// Test cases for authorization validation
const authTestCases = [
  {
    name: "No Authorization Header",
    headers: {
      "Content-Type": "application/json",
    },
    expectedError: -32504,
  },
  {
    name: "Invalid Authorization Format",
    headers: {
      "Content-Type": "application/json",
      Authorization: "InvalidFormat",
    },
    expectedError: -32504,
  },
  {
    name: "Invalid Basic Auth Format",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic invalid-base64",
    },
    expectedError: -32504,
  },
  {
    name: "Invalid Merchant ID",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic SW52YWxpZE1lcmNoYW50OnpOcDIwdktkdiYjOElkU2FXa0UyS2MjeDdGSldDZUZOMmlLUQ==",
    },
    expectedError: -32504,
  },
  {
    name: "Valid Authorization (should succeed)",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic UGF5Y29tOnpOcDIwdktkdiYjOElkU2FXa0UyS2MjeDdGSldDZUZOMmlLUQ==",
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
      method: "CheckPerformTransaction",
      params: {
        amount: 50000,
        account: { orderId: "valid-order-123" },
      },
    });

    const options = {
      hostname: "localhost",
      port: 4000,
      path: WEBHOOK_PATH,
      method: "POST",
      headers: {
        ...testCase.headers,
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

// Function to run authorization tests
async function runAuthTests() {
  console.log("🚀 Starting Authorization Validation Tests...\n");

  let passed = 0;
  let failed = 0;

  for (const testCase of authTestCases) {
    try {
      console.log(`📋 Testing: ${testCase.name}`);
      console.log(`   Headers: ${JSON.stringify(testCase.headers)}`);

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

  console.log("📊 Authorization Test Results Summary");
  console.log("====================================");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log(
      "\n🎉 All authorization tests passed! Your Payme authorization validation is working correctly."
    );
  } else {
    console.log(
      "\n⚠️  Some authorization tests failed. Please check the issues above."
    );
  }
}

// Run the tests
runAuthTests().catch(console.error);
