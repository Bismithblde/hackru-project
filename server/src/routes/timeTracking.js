const express = require("express");
const router = express.Router();
const timeTrackingService = require("../services/timeTrackingService");

/**
 * GET /api/time-tracking/room/:roomId
 * Get time stats for all users in a room
 */
router.get("/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const stats = await timeTrackingService.getRoomTimeStats(roomId);

    res.json({
      success: true,
      roomId,
      users: stats,
      count: stats.length,
    });
  } catch (error) {
    console.error("[TimeTracking API] Error getting room stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get room time stats",
      error: error.message,
    });
  }
});

/**
 * GET /api/time-tracking/room/:roomId/user/:userId
 * Get time stats for a specific user in a room
 */
router.get("/room/:roomId/user/:userId", async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const stats = await timeTrackingService.getUserTimeStats(roomId, userId);

    res.json({
      success: true,
      roomId,
      userId,
      stats,
    });
  } catch (error) {
    console.error("[TimeTracking API] Error getting user stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user time stats",
      error: error.message,
    });
  }
});

/**
 * POST /api/time-tracking/cleanup
 * Manually trigger cleanup of stale sessions
 */
router.post("/cleanup", async (req, res) => {
  try {
    const { maxAgeMinutes = 60 } = req.body;
    const cleanedCount = await timeTrackingService.cleanupStaleSessions(
      maxAgeMinutes
    );

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} stale sessions`,
      cleanedCount,
    });
  } catch (error) {
    console.error("[TimeTracking API] Error cleaning up sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup stale sessions",
      error: error.message,
    });
  }
});

module.exports = router;
