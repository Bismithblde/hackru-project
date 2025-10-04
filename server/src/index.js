require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Server } = require("socket.io");
const { createRoomService } = require("./services/roomService");
const { createSocketController } = require("./controllers/socketController");
const { createDailyRoom } = require("./services/dailyService");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ status: "ok", time: Date.now() }));

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
    origin: process.env.CORS_ALLOWED_ORIGINS || "*",
    methods: ["GET", "POST"],
  },
});

const roomService = createRoomService();
const socketController = createSocketController(io, roomService);

io.on("connection", (socket) => {
  socketController.register(socket);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Network access: http://192.168.40.38:${PORT}`);
});
