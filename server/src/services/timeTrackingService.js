const TimeTracking = require("../models/TimeTracking");

/**
 * Start tracking time for a user in a room
 */
async function startTracking(roomId, userId, username) {
  try {
    // Check if there's an existing active session
    const existingSession = await TimeTracking.findOne({
      roomId,
      userId,
      isActive: true,
    });

    if (existingSession) {
      console.log(`[TimeTracking] User ${username} already has active session in room ${roomId}`);
      return existingSession;
    }

    // Create new session
    const session = new TimeTracking({
      roomId,
      userId,
      username,
      sessionStart: new Date(),
      isActive: true,
    });

    await session.save();
    console.log(`[TimeTracking] ✅ Started tracking for ${username} in room ${roomId}`);
    return session;
  } catch (error) {
    console.error("[TimeTracking] Error starting tracking:", error);
    throw error;
  }
}

/**
 * End tracking time for a user in a room
 */
async function endTracking(roomId, userId) {
  try {
    const session = await TimeTracking.findOne({
      roomId,
      userId,
      isActive: true,
    });

    if (!session) {
      console.log(`[TimeTracking] No active session found for user ${userId} in room ${roomId}`);
      return null;
    }

    // End the session and calculate duration
    session.endSession();
    await session.save();

    // Update total time for this user in this room
    const allSessions = await TimeTracking.find({
      roomId,
      userId,
      isActive: false,
    });

    const totalTime = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Update all sessions with the new total time
    await TimeTracking.updateMany(
      { roomId, userId },
      { $set: { totalTime } }
    );

    console.log(`[TimeTracking] ✅ Ended session for ${session.username} - Duration: ${Math.round(session.duration / 1000)}s`);
    return session;
  } catch (error) {
    console.error("[TimeTracking] Error ending tracking:", error);
    throw error;
  }
}

/**
 * Get time stats for all users in a room
 */
async function getRoomTimeStats(roomId) {
  try {
    // Get all sessions for this room
    const sessions = await TimeTracking.find({ roomId }).sort({ sessionStart: -1 });

    // Group by user and calculate stats
    const userStats = {};

    for (const session of sessions) {
      if (!userStats[session.userId]) {
        userStats[session.userId] = {
          userId: session.userId,
          username: session.username,
          totalTime: 0,
          sessionCount: 0,
          isCurrentlyActive: false,
          lastSeen: session.sessionStart,
        };
      }

      const stats = userStats[session.userId];
      stats.sessionCount++;
      
      if (session.isActive) {
        stats.isCurrentlyActive = true;
        // Calculate current duration for active sessions
        const currentDuration = Date.now() - session.sessionStart.getTime();
        stats.totalTime += currentDuration;
      } else {
        stats.totalTime += session.duration || 0;
      }

      // Update last seen
      if (session.sessionStart > stats.lastSeen) {
        stats.lastSeen = session.sessionStart;
      }
    }

    // Convert to array and sort by total time
    const statsArray = Object.values(userStats).sort((a, b) => b.totalTime - a.totalTime);

    return statsArray;
  } catch (error) {
    console.error("[TimeTracking] Error getting room stats:", error);
    throw error;
  }
}

/**
 * Get time stats for a specific user in a room
 */
async function getUserTimeStats(roomId, userId) {
  try {
    const sessions = await TimeTracking.find({ roomId, userId }).sort({ sessionStart: -1 });

    if (sessions.length === 0) {
      return {
        userId,
        totalTime: 0,
        sessionCount: 0,
        isCurrentlyActive: false,
        sessions: [],
      };
    }

    let totalTime = 0;
    let isCurrentlyActive = false;

    for (const session of sessions) {
      if (session.isActive) {
        isCurrentlyActive = true;
        const currentDuration = Date.now() - session.sessionStart.getTime();
        totalTime += currentDuration;
      } else {
        totalTime += session.duration || 0;
      }
    }

    return {
      userId,
      username: sessions[0].username,
      totalTime,
      sessionCount: sessions.length,
      isCurrentlyActive,
      sessions: sessions.map(s => ({
        sessionStart: s.sessionStart,
        sessionEnd: s.sessionEnd,
        duration: s.duration,
        isActive: s.isActive,
      })),
    };
  } catch (error) {
    console.error("[TimeTracking] Error getting user stats:", error);
    throw error;
  }
}

/**
 * Clean up stale active sessions (in case of crashes/disconnects)
 * End any active sessions older than the specified time
 */
async function cleanupStaleSessions(maxAgeMinutes = 60) {
  try {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const staleSessions = await TimeTracking.find({
      isActive: true,
      sessionStart: { $lt: cutoffTime },
    });

    for (const session of staleSessions) {
      session.endSession();
      await session.save();
      console.log(`[TimeTracking] Cleaned up stale session for ${session.username} in room ${session.roomId}`);
    }

    return staleSessions.length;
  } catch (error) {
    console.error("[TimeTracking] Error cleaning up stale sessions:", error);
    throw error;
  }
}

module.exports = {
  startTracking,
  endTracking,
  getRoomTimeStats,
  getUserTimeStats,
  cleanupStaleSessions,
};
