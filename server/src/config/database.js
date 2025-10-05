const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("📦 MongoDB: Using existing connection");
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.warn("⚠️  MongoDB: MONGODB_URI not found in environment variables");
    console.warn("⚠️  MongoDB: Whiteboard persistence will be disabled");
    return;
  }

  try {
    console.log("🔄 MongoDB: Attempting to connect...");
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log("✅ MongoDB: Connected successfully");
    console.log(`📦 MongoDB: Database - ${conn.connection.name}`);
    console.log(`🌍 MongoDB: Host - ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB: Connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB: Disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB: Reconnected");
      isConnected = true;
    });
  } catch (error) {
    console.error("❌ MongoDB: Connection failed:", error.message);
    console.error("❌ MongoDB: Full error:", error);
    console.warn("⚠️  MongoDB: Whiteboard persistence will be disabled");
    isConnected = false;
  }
};

const disconnectDB = async () => {
  if (!isConnected) return;

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log("✅ MongoDB: Disconnected gracefully");
  } catch (error) {
    console.error("❌ MongoDB: Error during disconnect:", error);
  }
};

const isDBConnected = () => isConnected;

module.exports = {
  connectDB,
  disconnectDB,
  isDBConnected,
};
