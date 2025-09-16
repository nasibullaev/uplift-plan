/**
 * MongoDB script to create test orders from 20 to 40
 * Run this script directly in MongoDB or MongoDB Compass
 */

// Configuration
const START_ORDER = 20;
const END_ORDER = 40;
const TEST_PLAN_ID = ObjectId("your_plan_id"); // Replace with actual plan ID
const TEST_USER_ID = ObjectId("your_user_id"); // Replace with actual user ID

// Function to create a single test order
function createTestOrder(orderNumber) {
  const orderId = `test_order_${orderNumber}`;
  const now = new Date();
  
  const order = {
    orderId: orderId,
    userId: TEST_USER_ID,
    planId: TEST_PLAN_ID,
    amount: 1000, // 1000 UZS
    description: `Test order ${orderNumber} for Payme integration testing`,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
    metadata: {
      testOrder: true,
      orderNumber: orderNumber,
      createdBy: "test-script"
    }
  };
  
  return order;
}

// Create all test orders
print("🚀 Creating test orders from " + START_ORDER + " to " + END_ORDER + "...");

const orders = [];
const errors = [];

for (let orderNumber = START_ORDER; orderNumber <= END_ORDER; orderNumber++) {
  try {
    const order = createTestOrder(orderNumber);
    
    // Insert the order into the database
    const result = db.orders.insertOne(order);
    
    if (result.insertedId) {
      orders.push({
        orderNumber: orderNumber,
        orderId: order.orderId,
        insertedId: result.insertedId
      });
      print("✅ Order " + orderNumber + " (" + order.orderId + ") created successfully!");
    } else {
      errors.push(orderNumber);
      print("❌ Failed to create order " + orderNumber);
    }
  } catch (error) {
    errors.push(orderNumber);
    print("❌ Error creating order " + orderNumber + ": " + error.message);
  }
}

// Summary
print("\n📊 SUMMARY:");
print("✅ Successfully created: " + orders.length + " orders");
print("❌ Failed to create: " + errors.length + " orders");

if (errors.length > 0) {
  print("❌ Failed order numbers: " + errors.join(", "));
}

if (orders.length > 0) {
  print("\n📋 Created Orders:");
  orders.forEach(function(order) {
    print("  " + order.orderNumber + ": " + order.orderId + " (" + order.insertedId + ")");
  });
}

print("\n🎉 Script completed!");

// Return the results for programmatic use
{
  success: orders.length,
  failed: errors.length,
  orders: orders,
  errors: errors
}
