#!/usr/bin/env node

/**
 * Script to create test_order_40 and test_order_41 with amount 50000 UZS for Payme integration testing
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

async function createTestOrders40And41() {
  try {
    const orderIds = ["test_order_40", "test_order_41"];
    const amountUZS = 50000; // 50000 UZS as requested
    const amountTiyin = amountUZS * 100; // Convert to tiyin (1 UZS = 100 tiyin)

    console.log(
      `🚀 Creating test orders: ${orderIds.join(", ")} with amount ${amountUZS} UZS each...`
    );

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

    // Create both orders
    for (const orderId of orderIds) {
      // Check if order already exists
      const existingOrder = await Order.findOne({ orderId: orderId });
      if (existingOrder) {
        console.log(`ℹ️  ${orderId} already exists, updating it...`);
        existingOrder.userId = testUser._id;
        existingOrder.planId = plan._id;
        existingOrder.paymentMethod = "Payme";
        existingOrder.amount = amountUZS;
        existingOrder.amountInTiyin = amountTiyin;
        existingOrder.description = `Test order ${orderId} - ${plan.title} plan`;
        existingOrder.status = "PENDING";
        await existingOrder.save();
        console.log(`✅ ${orderId} updated successfully`);
      } else {
        console.log(`🛒 Creating ${orderId}...`);

        // Create the test order
        const testOrder = new Order({
          orderId: orderId,
          userId: testUser._id,
          planId: plan._id,
          paymentMethod: "Payme",
          amount: amountUZS,
          amountInTiyin: amountTiyin,
          description: `Test order ${orderId} - ${plan.title} plan`,
          status: "PENDING",
          returnUrl: "http://localhost:3000/payment/success",
        });

        await testOrder.save();
        console.log(`✅ ${orderId} created successfully`);
      }
    }

    console.log("\n🎉 Test orders creation completed successfully!");
    console.log("=====================================");
    console.log(`Orders Created: ${orderIds.join(", ")}`);
    console.log(`User ID: ${testUser._id}`);
    console.log(`Plan: ${plan.title}`);
    console.log(`Amount per Order: ${amountUZS} UZS`);
    console.log(
      `Amount in Tiyin per Order: ${amountTiyin} (1 UZS = 100 tiyin)`
    );
    console.log("Payment Method: Payme");
    console.log("Status: PENDING");
    console.log("=====================================");
    console.log(
      "\n📝 You can now use these orders for Payme integration testing:"
    );
    orderIds.forEach((orderId) => {
      console.log(`   - Order ID: ${orderId}`);
      console.log(
        `   - Amount: ${amountTiyin} tiyin (${amountUZS} UZS) - 1 UZS = 100 tiyin`
      );
    });
    console.log("   - Payment Method: Payme");
    console.log("\n🧪 Test the Payme integration with these orders!");
  } catch (error) {
    console.error("❌ Error creating test orders:", error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the script
createTestOrders40And41().catch(console.error);
