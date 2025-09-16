#!/usr/bin/env node

/**
 * Script to create test_order_17 directly in the database
 * This creates a test order similar to order_16 for Payme integration testing
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define schemas
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

const UserSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    role: { type: String, default: "USER" },
    status: { type: String, default: "ACTIVE" },
    avatar: { type: String },
    lastLoginAt: { type: Date },
    phoneVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
  },
  { timestamps: true }
);

const PlanSchema = new mongoose.Schema(
  {
    icon: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, default: "UZS" },
    durationInDays: { type: Number, required: true },
    trialCount: { type: Number, required: true },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    billingCycle: { type: String, default: "MONTHLY" },
    type: { type: String, default: "BASIC" },
    status: { type: String, default: "ACTIVE" },
    tags: { type: [String], default: [] },
    maxUsers: { type: Number, default: 0 },
    maxSubmissions: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

async function createTestOrder17() {
  try {
    console.log("🚀 Connecting to MongoDB...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/uplift-plan"
    );
    console.log("✅ Connected to MongoDB");

    // Get models
    const Order = mongoose.model("Order", OrderSchema);
    const User = mongoose.model("User", UserSchema);
    const Plan = mongoose.model("Plan", PlanSchema);

    // Find or create a test user
    let testUser = await User.findOne({ phone: "+998901234567" });
    if (!testUser) {
      console.log("👤 Creating test user...");
      testUser = new User({
        phone: "+998901234567",
        role: "USER",
        status: "ACTIVE",
        phoneVerified: true,
      });
      await testUser.save();
      console.log(`✅ Test user created with ID: ${testUser._id}`);
    } else {
      console.log(`✅ Using existing test user with ID: ${testUser._id}`);
    }

    // Get the first available plan
    const plan = await Plan.findOne({ isActive: true }).sort({ sortOrder: 1 });
    if (!plan) {
      throw new Error("No active plans found in the database");
    }
    console.log(`📦 Using plan: ${plan.title} (${plan.price} UZS)`);

    // Check if test_order_18 already exists
    const existingOrder = await Order.findOne({ orderId: "test_order_18" });
    if (existingOrder) {
      console.log("ℹ️  test_order_18 already exists, updating it...");
      existingOrder.userId = testUser._id;
      existingOrder.planId = plan._id;
      existingOrder.paymentMethod = "Payme";
      existingOrder.amount = plan.price;
      existingOrder.amountInTiyin = plan.price * 100; // Convert to tiyin
      existingOrder.description = `Upgrade to ${plan.title} plan`;
      existingOrder.status = "PENDING";
      await existingOrder.save();
      console.log("✅ test_order_18 updated successfully");
    } else {
      console.log("🛒 Creating test_order_18...");

      // Create the test order
      const testOrder = new Order({
        orderId: "test_order_18",
        userId: testUser._id,
        planId: plan._id,
        paymentMethod: "Payme",
        amount: plan.price,
        amountInTiyin: plan.price * 100, // Convert to tiyin
        description: `Upgrade to ${plan.title} plan`,
        status: "PENDING",
        returnUrl: "http://localhost:3000/payment/success",
      });

      await testOrder.save();
      console.log("✅ test_order_18 created successfully");
    }

    console.log("\n🎉 Test order creation completed successfully!");
    console.log("=====================================");
    console.log("Order ID: test_order_18");
    console.log(`User ID: ${testUser._id}`);
    console.log(`Plan: ${plan.title}`);
    console.log(`Amount: ${plan.price} UZS`);
    console.log(`Amount in Tiyin: ${plan.price * 100}`);
    console.log("Payment Method: Payme");
    console.log("Status: PENDING");
    console.log("=====================================");
    console.log(
      "\n📝 You can now use this order for Payme integration testing:"
    );
    console.log("   - Order ID: test_order_18");
    console.log(`   - Amount: ${plan.price * 100} tiyin (${plan.price} UZS)`);
    console.log("   - Payment Method: Payme");
    console.log(
      "\n🧪 Test the PerformTransaction idempotency with this order!"
    );
  } catch (error) {
    console.error("❌ Error creating test order:", error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the script
createTestOrder17().catch(console.error);
