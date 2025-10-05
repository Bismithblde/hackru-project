require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Server } = require("socket.io");
const { connectDB, disconnectDB } = require("./config/database");
const { closeRedis } = require("./config/redis"); // Initialize Redis
const { createRoomService } = require("./services/roomService");
const { createSocketController } = require("./controllers/socketController");
const { createDailyRoom } = require("./services/dailyService");
const { roomRouter } = require("./routes/roomRoutes");
const {
  saveWhiteboard,
  loadWhiteboard,
  listWhiteboards,
  deleteWhiteboard,
  updateWhiteboard,
} = require("./controllers/whiteboardController");

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : "*";

console.log("🌐 CORS Configuration:", CORS_ORIGIN);

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ status: "ok", time: Date.now() }));

// Room management API routes
app.use("/api/rooms", roomRouter);

// Whiteboard persistence routes
app.post("/api/whiteboards/save", saveWhiteboard);
app.get("/api/whiteboards/:id", loadWhiteboard);
app.get("/api/whiteboards", listWhiteboards);
app.put("/api/whiteboards/:id", updateWhiteboard);
app.delete("/api/whiteboards/:id", deleteWhiteboard);

// Daily.co room endpoint
app.get("/api/daily-room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await createDailyRoom(roomId);
    res.json(room);
  } catch (error) {
    console.error("Failed to create Daily room:", error);
    res.status(500).json({ error: error.message });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

const roomService = createRoomService();
const socketController = createSocketController(io, roomService);

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socketController.register(socket);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\n[Server] Shutting down gracefully...");

  try {
    // Disconnect from MongoDB
    await disconnectDB();

    // Close Redis connection
    await closeRedis();

    // Close Socket.io connections
    io.close(() => {
      console.log("[Server] Socket.io connections closed");
    });

    // Close HTTP server
    server.close(() => {
      console.log("[Server] HTTP server closed");
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error("[Server] Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error("[Server] Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(PORT, "0.0.0.0", async () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🚀 Server started successfully!`);
  console.log(`${"=".repeat(50)}`);
  console.log(`📡 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io: Ready`);
  console.log(`🌐 CORS Origins: ${CORS_ORIGIN}`);
  console.log(`${"=".repeat(50)}\n`);
  console.log(`Network access: http://192.168.40.38:${PORT}`);

  // Connect to MongoDB after server starts
  await connectDB();
});
