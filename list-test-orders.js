const mongoose = require("mongoose");
require("dotenv").config();

// Define Order schema
const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    paymentMethod: { type: String, required: true },
    status: { type: String, default: "PENDING" },
    amount: { type: Number, required: true },
    amountInTiyin: { type: Number, required: true },
    transactionId: { type: String },
    paymentUrl: { type: String },
    description: { type: String },
    returnUrl: { type: String },
    failureReason: { type: String },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    metadata: { type: Object },
  },
  { timestamps: true }
);

async function listOrders() {
  try {
    console.log("📋 Listing all test orders...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/uplift-plan"
    );
    console.log("✅ Connected to MongoDB");

    const Order = mongoose.model("Order", OrderSchema);

    // Find all test orders
    const orders = await Order.find({ orderId: /^test_order_/ }).sort({
      createdAt: -1,
    });

    console.log(`\nFound ${orders.length} test orders:`);
    console.log("=====================================");

    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.orderId}`);
      console.log(`   Amount (UZS): ${order.amount}`);
      console.log(`   Amount (Tiyin): ${order.amountInTiyin}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log("   ---");
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

listOrders();
