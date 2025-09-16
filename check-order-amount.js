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

async function checkOrderAmount() {
  try {
    console.log("🔍 Checking test_order_32 amount...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/uplift-plan"
    );
    console.log("✅ Connected to MongoDB");

    const Order = mongoose.model("Order", OrderSchema);

    // Find the order
    const order = await Order.findOne({ orderId: "test_order_32" });

    if (!order) {
      console.log("❌ Order test_order_32 not found");
      return;
    }

    console.log("📋 Order Details:");
    console.log(`Order ID: ${order.orderId}`);
    console.log(`Amount (UZS): ${order.amount}`);
    console.log(`Amount (Tiyin): ${order.amountInTiyin}`);
    console.log(`Status: ${order.status}`);
    console.log(`Created: ${order.createdAt}`);

    console.log("\n🧮 Conversion Check:");
    console.log(`Expected tiyin: ${order.amount * 100}`);
    console.log(`Actual tiyin: ${order.amountInTiyin}`);
    console.log(
      `Match: ${order.amount * 100 === order.amountInTiyin ? "✅" : "❌"}`
    );

    console.log("\n🧪 Test Request Analysis:");
    console.log(`Test sends: 5,000,000 tiyin`);
    console.log(`Order expects: ${order.amountInTiyin} tiyin`);
    console.log(`Match: ${5000000 === order.amountInTiyin ? "✅" : "❌"}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkOrderAmount();
