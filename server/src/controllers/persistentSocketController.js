const { requireFields } = require("../utils/validator");
const persistentRoomService = require("../services/persistentRoomService");
const { isRedisAvailable } = require("../config/redis");
const { registerQuizEvents, cleanupRoomQuiz } = require("./quizController");
const timeTrackingService = require("../services/timeTrackingService");

// In-memory chat storage (no Redis)
const roomMessages = new Map(); // roomId -> array of messages
const MESSAGE_HISTORY_LIMIT = 50;

/**
 * Enhanced Socket Controller with optional Redis Persistence
 * Chat uses in-memory storage for reliability
 */
function createPersistentSocketController(io, roomService) {
  function register(socket) {
    let lastAwardTs = 0;

    // Register Quiz events
    registerQuizEvents(socket, io, roomService);

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
        console.log(
          `[Socket] ✅ Socket ${socket.id} joined Socket.io room ${roomId}`
        );

        // Add to in-memory room service (for presence)
        roomService.addUser(roomId, { socketId: socket.id, userId, username });
        console.log(
          `[Socket] ✅ Added ${username} to in-memory room service for ${roomId}`
        );

        // Start time tracking
        try {
          await timeTrackingService.startTracking(roomId, userId, username);
        } catch (err) {
          console.error("[Socket] Error starting time tracking:", err.message);
          // Continue anyway - time tracking is optional
        }

        // Add to Redis (for persistence) - only if Redis is available
        if (isRedisAvailable()) {
          try {
            const data = await persistentRoomService.joinRoom(
              roomId,
              userId,
              username
            );

            // Send in-memory chat history (no Redis)
            const messages = roomMessages.get(roomId) || [];
            if (messages.length > 0) {
              socket.emit("chat:history", {
                messages: messages,
                count: messages.length,
              });
              console.log(
                `[Socket] Sent ${messages.length} in-memory messages to ${username}`
              );
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

          // Still send in-memory chat history even without Redis
          const messages = roomMessages.get(roomId) || [];
          if (messages.length > 0) {
            socket.emit("chat:history", {
              messages: messages,
              count: messages.length,
            });
            console.log(
              `[Socket] Sent ${messages.length} in-memory messages to ${username} (no Redis)`
            );
          }
        }

        // Broadcast presence update to all users in room
        const users = roomService.getUsers(roomId);
        io.to(roomId).emit("presence:update", users);
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

        // Clean up quiz if room is empty
        if (users.length === 0) {
          cleanupRoomQuiz(roomId);

          // Clean up in-memory chat messages
          if (roomMessages.has(roomId)) {
            roomMessages.delete(roomId);
            console.log(
              `[Socket] Cleaned up chat messages for empty room ${roomId}`
            );
          }
        }

        console.log(`[Socket] User ${userId} left room ${roomId}`);
      } catch (error) {
        console.error("[Socket] Error in leave handler:", error);
      }
    });

    /**
     * Chat message event - In-memory storage only (no Redis)
     */
    socket.on("chat:message", async (payload = {}) => {
      console.log(`[Socket] Received chat:message event:`, payload);

      const ok = requireFields(payload, ["roomId", "userId", "message"]);
      if (!ok) {
        console.error(`[Socket] Chat message validation failed:`, payload);
        return;
      }

      const { roomId, userId, username, message, ts } = payload;

      // Create message object
      const out = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        username: username || "Anonymous",
        message,
        ts: ts || Date.now(),
      };

      console.log(`[Socket] Created message object:`, out);

      // Store in memory
      if (!roomMessages.has(roomId)) {
        roomMessages.set(roomId, []);
        console.log(`[Socket] Created new message array for room ${roomId}`);
      }
      const messages = roomMessages.get(roomId);
      messages.push(out);

      // Keep only last N messages
      if (messages.length > MESSAGE_HISTORY_LIMIT) {
        messages.shift();
      }

      console.log(
        `[Socket] Room ${roomId} now has ${messages.length} messages`
      );

      // Broadcast immediately to all users in room
      io.to(roomId).emit("chat:message", out);
      console.log(`[Socket] Broadcast chat:message to room ${roomId}:`, out);
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

      // End time tracking for this user in all rooms
      if (userInfo && userInfo.userId) {
        for (const [roomId] of roomService.rooms) {
          try {
            await timeTrackingService.endTracking(roomId, userInfo.userId);
          } catch (err) {
            console.error("[Socket] Error ending time tracking on disconnect:", err.message);
          }
        }
      }

      // Update presence for all rooms this user was in
      for (const [roomId] of roomService.rooms) {
        const users = roomService.getUsers(roomId);
        io.to(roomId).emit("presence:update", users);

        // Clean up in-memory chat if room is empty
        if (users.length === 0) {
          if (roomMessages.has(roomId)) {
            roomMessages.delete(roomId);
            console.log(
              `[Socket] Cleaned up chat for empty room ${roomId} on disconnect`
            );
          }
          cleanupRoomQuiz(roomId);
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
