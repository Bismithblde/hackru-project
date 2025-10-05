const express = require("express");
const router = express.Router();
const mongoRoomService = require("../services/mongoRoomService");

/**
 * Room Management Routes (MongoDB-backed for persistence)
 */

// POST /api/rooms/create - Create a new room
router.post("/create", async (req, res) => {
  try {
    const { name, createdBy, description, maxParticipants, settings } =
      req.body;

    if (!name || !createdBy) {
      return res.status(400).json({
        success: false,
        error: "Room name and creator name are required",
      });
    }

    const room = await mongoRoomService.createRoom({
      name,
      createdBy,
      description,
      maxParticipants,
      settings,
    });

    console.log(`[Room Created] Code: ${room.code}, Name: ${name}`);

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create room",
    });
  }
});

// POST /api/rooms/join - Join a room by code
router.post("/join", async (req, res) => {
  try {
    const { code, username } = req.body;

    if (!code || !username) {
      return res.status(400).json({
        success: false,
        error: "Room code and username are required",
      });
    }

    const room = await mongoRoomService.getRoom(code);

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
      error: error.message || "Failed to join room",
    });
  }
});

// GET /api/rooms - Get all active rooms
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "100", 10);
    const allRooms = await mongoRoomService.getAllRooms(limit);

    res.json({
      success: true,
      rooms: allRooms,
      count: allRooms.length,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch rooms",
    });
  }
});

// GET /api/rooms/:code - Get room by code
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const room = await mongoRoomService.getRoom(code);

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
      error: error.message || "Failed to fetch room",
    });
  }
});

// DELETE /api/rooms/:code - Delete a room
router.delete("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const room = await mongoRoomService.getRoom(code);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    await mongoRoomService.deleteRoom(code);
    console.log(`[Room Deleted] Code: ${code}`);

    res.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete room",
    });
  }
});

// GET /api/rooms/:code/stats - Get room statistics
router.get("/:code/stats", async (req, res) => {
  try {
    const { code } = req.params;
    const stats = await mongoRoomService.getRoomStats(code);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch stats",
    });
  }
});

// GET /api/rooms/:code/messages - Get message history
router.get("/:code/messages", async (req, res) => {
  try {
    const { code } = req.params;
    const limit = parseInt(req.query.limit || "50", 10);

    const messages = await roomService.getMessages(code, limit);

    res.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch messages",
    });
  }
});

// GET /api/rooms/:code/whiteboard - Get whiteboard state
router.get("/:code/whiteboard", async (req, res) => {
  try {
    const { code } = req.params;
    const whiteboard = await roomService.getWhiteboard(code);

    res.json({
      success: true,
      whiteboard,
    });
  } catch (error) {
    console.error("Error fetching whiteboard:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch whiteboard",
    });
  }
});

// GET /api/rooms/:code/stats - Get room statistics
router.get("/:code/stats", async (req, res) => {
  try {
    const { code } = req.params;
    const stats = await roomService.getRoomStats(code);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch stats",
    });
  }
});

module.exports = { roomRouter: router };
