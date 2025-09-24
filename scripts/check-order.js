/*
  Usage:
    MONGODB_URI="mongodb://localhost:27017/uplift-plan" node scripts/check-order.js order_...

  If no argument is provided, it will check the hardcoded orderId below.
*/

// Try to load environment variables from .env if present
try {
  require("dotenv").config();
} catch (e) {}

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

// Allow passing orderId as CLI arg; fallback to the provided example
const inputOrderId = process.argv[2];
const orderId =
  inputOrderId ||
  "order_68d27bf517ffad0f04e7ba86_68c0271342e33d4c65aac7a3_1758629732672";

async function main() {
  const startedAt = new Date();
  console.log("=== Check Order Script START ===");
  console.log("Time:", startedAt.toISOString());
  console.log("MongoDB URI:", MONGODB_URI);
  console.log("Order ID:", orderId);

  try {
    await mongoose.connect(MONGODB_URI, {
      // keep options minimal; mongoose v7+ uses sensible defaults
    });

    // Access the native collection directly to avoid schema mismatches
    const db = mongoose.connection.db;
    const orders = db.collection("orders");

    // Find by unique orderId
    const order = await orders.findOne({ orderId });

    if (!order) {
      console.error("Order not found:", orderId);
      // For quick diagnostics, show the most recent few orders
      const recent = await orders
        .find(
          {},
          { projection: { _id: 0, orderId: 1, status: 1, createdAt: 1 } }
        )
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      console.log("Most recent 5 orders (orderId, status, createdAt):");
      console.dir(recent, { depth: null, colors: true });
      return;
    }

    console.log("Order found:");
    console.dir(order, { depth: null, colors: true });
  } catch (err) {
    console.error("Error while checking order:", err?.message || err);
    if (err?.stack) console.error(err.stack);
  } finally {
    try {
      await mongoose.disconnect();
    } catch {}
    console.log("=== Check Order Script END ===");
  }
}

main();
