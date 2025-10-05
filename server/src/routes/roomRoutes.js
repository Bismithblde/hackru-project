const express = require("express");
const router = express.Router();

// In-memory room storage (in production, use a database)
const rooms = new Map();

// Generate a random 6-digit code
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Ensure code is unique
function generateUniqueCode() {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }
  return code;
}

// POST /api/rooms/create - Create a new room
router.post("/create", (req, res) => {
  try {
    const { name, createdBy, maxParticipants } = req.body;

    if (!name || !createdBy) {
      return res.status(400).json({
        success: false,
        error: "Room name and creator name are required",
      });
    }

    const code = generateUniqueCode();
    const room = {
      id: code,
      code,
      name: name.trim(),
      createdBy: createdBy.trim(),
      createdAt: Date.now(),
      participantCount: 0,
      maxParticipants: maxParticipants || 10,
    };

    rooms.set(code, room);

    console.log(`[Room Created] Code: ${code}, Name: ${name}`);

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create room",
    });
  }
});

// POST /api/rooms/join - Join a room by code
router.post("/join", (req, res) => {
  try {
    const { code, username } = req.body;

    if (!code || !username) {
      return res.status(400).json({
        success: false,
        error: "Room code and username are required",
      });
    }

    const room = rooms.get(code);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found. Please check the code and try again.",
      });
    }

    console.log(`[Room Joined] Code: ${code}, User: ${username}`);

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join room",
    });
  }
});

// GET /api/rooms - Get all active rooms
router.get("/", (req, res) => {
  try {
    const allRooms = Array.from(rooms.values());
    res.json({
      success: true,
      rooms: allRooms,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch rooms",
    });
  }
});

// GET /api/rooms/:code - Get room by code
router.get("/:code", (req, res) => {
  try {
    const { code } = req.params;
    const room = rooms.get(code);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch room",
    });
  }
});

// DELETE /api/rooms/:code - Delete a room
router.delete("/:code", (req, res) => {
  try {
    const { code } = req.params;
    
    if (!rooms.has(code)) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    rooms.delete(code);
    console.log(`[Room Deleted] Code: ${code}`);

    res.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete room",
    });
  }
});

// Export both router and rooms Map (for socket updates)
module.exports = { roomRouter: router, roomsMap: rooms };
