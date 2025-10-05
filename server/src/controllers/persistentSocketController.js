const { requireFields } = require("../utils/validator");
const persistentRoomService = require("../services/persistentRoomService");
const { isRedisAvailable } = require("../config/redis");
const { registerPomodoroEvents, cleanupRoomPomodoro } = require("./pomodoroController");

/**
 * Enhanced Socket Controller with Redis Persistence
 * Integrates real-time events with persistent storage
 */
function createPersistentSocketController(io, roomService) {
  // Track study time for automatic points
  const studyTimers = new Map(); // roomId -> Map(userId -> startTime)

  function register(socket) {
    let lastAwardTs = 0;

    // Register Pomodoro events
    registerPomodoroEvents(socket, io);

    /**
     * Join room event - Enhanced with Redis persistence
     */
    socket.on("join", async (payload = {}) => {
      const ok = requireFields(payload, ["roomId", "userId", "username"]);
      if (!ok) return socket.emit("error", { message: "invalid join payload" });

      const { roomId, userId, username } = payload;

      try {
        // Join Socket.io room
        socket.join(roomId);

        // Add to in-memory room service (for presence)
        roomService.addUser(roomId, { socketId: socket.id, userId, username });

        // Add to Redis (for persistence) - only if Redis is available
        if (isRedisAvailable()) {
          try {
            const data = await persistentRoomService.joinRoom(
              roomId,
              userId,
              username
            );

            // Send message history to the user who just joined
            if (data.messages && data.messages.length > 0) {
              socket.emit("chat:history", {
                messages: data.messages,
                count: data.messages.length,
              });
            }

            // Send whiteboard state to the user who just joined
            if (data.whiteboard) {
              socket.emit("whiteboard:state", {
                elements: data.whiteboard.elements || [],
              });
            }

            console.log(
              `[Socket] User ${username} joined room ${roomId}, sent ${
                data.messages?.length || 0
              } messages and whiteboard state`
            );
          } catch (err) {
            console.error("[Socket] Error joining room in Redis:", err.message);
            // Continue anyway - user can still use the room without persistence
          }
        } else {
          console.log(
            `[Socket] Redis unavailable - skipping persistence for ${username} joining ${roomId}`
          );
        }

        // Broadcast presence update to all users in room
        const users = roomService.getUsers(roomId);
        io.to(roomId).emit("presence:update", users);

        // Start study timer
        if (!studyTimers.has(roomId)) {
          studyTimers.set(roomId, new Map());
        }
        studyTimers.get(roomId).set(userId, Date.now());
        console.log(`[Points] Started study timer for ${username}`);
      } catch (error) {
        console.error("[Socket] Error in join handler:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    /**
     * Leave room event - Enhanced with Redis cleanup
     */
    socket.on("leave", async (payload = {}) => {
      const { roomId, userId } = payload;
      if (!roomId) return;

      try {
        socket.leave(roomId);

        // Remove from in-memory service
        roomService.removeUser(roomId, socket.id);

        // Remove from Redis
        if (userId) {
          await persistentRoomService.leaveRoom(roomId, userId);
        }

        // Broadcast presence update
        const users = roomService.getUsers(roomId);
        io.to(roomId).emit("presence:update", users);

        // Calculate study time and award points
        if (userId && studyTimers.has(roomId)) {
          const roomTimers = studyTimers.get(roomId);
          if (roomTimers.has(userId)) {
            const startTime = roomTimers.get(userId);
            const studyMinutes = Math.floor((Date.now() - startTime) / 60000);
            
            if (studyMinutes >= 1) {
              // Award 1 point per minute of study
              const pointsEarned = studyMinutes;
              roomService.addPoints(roomId, userId, "Study Session", pointsEarned);
              
              const leaderboard = roomService.getLeaderboard(roomId);
              io.to(roomId).emit("points:update", { roomId, leaderboard });
              
              console.log(`[Points] Awarded ${pointsEarned} points to ${userId} for ${studyMinutes} minutes`);
            }
            
            roomTimers.delete(userId);
            if (roomTimers.size === 0) studyTimers.delete(roomId);
          }
        }

        console.log(`[Socket] User ${userId} left room ${roomId}`);
      } catch (error) {
        console.error("[Socket] Error in leave handler:", error);
      }
    });

    /**
     * Chat message event - Enhanced with Redis persistence
     */
    socket.on("chat:message", async (payload = {}) => {
      const ok = requireFields(payload, ["roomId", "userId", "message"]);
      if (!ok) return;

      const { roomId, userId, username, message, ts } = payload;

      // Prepare message object
      const messageObj = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        username: username || "Anonymous",
        message,
        timestamp: ts || Date.now(),
      };

      // Always broadcast to all users in room first (real-time chat)
      const out = {
        id: messageObj.id,
        userId: messageObj.userId,
        username: messageObj.username,
        message: messageObj.message,
        ts: messageObj.timestamp,
      };

      io.to(roomId).emit("chat:message", out);

      // Try to save to Redis for persistence (non-blocking)
      if (isRedisAvailable()) {
        try {
          await persistentRoomService.saveMessage(roomId, messageObj);
          console.log(`[Socket] Message saved to Redis and broadcast in room ${roomId}`);
        } catch (error) {
          console.error("[Socket] Error saving message to Redis (message was still broadcast):", error.message);
        }
      } else {
        console.log(`[Socket] Message broadcast in room ${roomId} (Redis unavailable, not persisted)`);
      }
    });

    /**
     * Whiteboard change event - Enhanced with Redis persistence
     */
    socket.on("whiteboard-change", async (payload = {}) => {
      const { roomId, elements } = payload;
      if (!roomId) return;

      try {
        // Save whiteboard state to Redis (debounced on client, saved on every change)
        await persistentRoomService.saveWhiteboard(roomId, { elements });

        // Broadcast to all other users in the room (not to sender)
        socket.to(roomId).emit("whiteboard-update", { elements });

        console.log(`[Socket] Whiteboard state saved for room ${roomId}`);
      } catch (error) {
        console.error("[Socket] Error saving whiteboard:", error);
      }
    });

    /**
     * Points award event (unchanged from original)
     */
    socket.on("points:award", (payload = {}) => {
      const ok = requireFields(payload, [
        "roomId",
        "fromUserId",
        "toUserId",
        "points",
      ]);
      if (!ok)
        return socket.emit("points:error", {
          message: "invalid points payload",
        });

      const { roomId, fromUserId, fromUsername, toUserId, toUsername, points } =
        payload;

      // basic validation
      if (fromUserId === toUserId)
        return socket.emit("points:error", {
          message: "cannot award points to yourself",
        });
      const pts = Number(points) || 0;
      if (pts <= 0 || pts > 10)
        return socket.emit("points:error", {
          message: "points must be between 1 and 10",
        });

      const now = Date.now();
      if (now - lastAwardTs < 3000)
        return socket.emit("points:error", {
          message: "rate limited: wait before awarding again",
        });
      lastAwardTs = now;

      // update leaderboard
      roomService.addPoints(roomId, toUserId, toUsername || "unknown", pts);
      const leaderboard = roomService.getLeaderboard(roomId);
      io.to(roomId).emit("points:update", { roomId, leaderboard });
    });

    /**
     * WebRTC signaling (unchanged from original)
     */
    socket.on("webrtc:offer", (payload = {}) => {
      const { to } = payload;
      console.log(`[WebRTC] Forwarding offer from ${socket.id} to ${to}`);
      if (to) io.to(to).emit("webrtc:offer", { ...payload, from: socket.id });
    });

    socket.on("webrtc:answer", (payload = {}) => {
      const { to } = payload;
      console.log(`[WebRTC] Forwarding answer from ${socket.id} to ${to}`);
      if (to) io.to(to).emit("webrtc:answer", { ...payload, from: socket.id });
    });

    socket.on("webrtc:ice", (payload = {}) => {
      const { to } = payload;
      console.log(`[WebRTC] Forwarding ICE from ${socket.id} to ${to}`);
      if (to) io.to(to).emit("webrtc:ice", { ...payload, from: socket.id });
    });

    /**
     * Disconnect event - Enhanced with Redis cleanup
     */
    socket.on("disconnect", async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);

      // Remove from in-memory service
      const userInfo = roomService.removeUserBySocket(socket.id);

      // Update presence for all rooms this user was in
      for (const [roomId] of roomService.rooms) {
        const users = roomService.getUsers(roomId);
        io.to(roomId).emit("presence:update", users);

        // Award study time points before removing user
        if (userInfo && userInfo.userId && studyTimers.has(roomId)) {
          const roomTimers = studyTimers.get(roomId);
          if (roomTimers.has(userInfo.userId)) {
            const startTime = roomTimers.get(userInfo.userId);
            const studyMinutes = Math.floor((Date.now() - startTime) / 60000);
            
            if (studyMinutes >= 1) {
              const pointsEarned = studyMinutes;
              roomService.addPoints(roomId, userInfo.userId, userInfo.username, pointsEarned);
              
              const leaderboard = roomService.getLeaderboard(roomId);
              io.to(roomId).emit("points:update", { roomId, leaderboard });
              
              console.log(`[Points] Awarded ${pointsEarned} points to ${userInfo.username} before disconnect`);
            }
            
            roomTimers.delete(userInfo.userId);
            if (roomTimers.size === 0) studyTimers.delete(roomId);
          }
        }

        // Remove from Redis if we have user info
        if (userInfo && userInfo.userId) {
          try {
            await persistentRoomService.leaveRoom(roomId, userInfo.userId);
          } catch (error) {
            console.error(
              "[Socket] Error removing user from Redis on disconnect:",
              error
            );
          }
        }
      }
    });
  }

  return { register };
}

module.exports = { createPersistentSocketController };
