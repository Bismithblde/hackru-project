const { requireFields } = require("../utils/validator");

function createSocketController(io, roomService) {
  function register(socket) {
    // simple per-socket rate limiter for awarding points
    let lastAwardTs = 0;

    socket.on("join", (payload = {}) => {
      const ok = requireFields(payload, ["roomId", "userId", "username"]);
      if (!ok) return socket.emit("error", { message: "invalid join payload" });

      const { roomId, userId, username } = payload;
      socket.join(roomId);
      roomService.addUser(roomId, { socketId: socket.id, userId, username });

      const users = roomService.getUsers(roomId);
      io.to(roomId).emit("presence:update", users);
    });

    socket.on("leave", (payload = {}) => {
      const { roomId } = payload;
      if (!roomId) return;
      socket.leave(roomId);
      roomService.removeUser(roomId, socket.id);
      const users = roomService.getUsers(roomId);
      io.to(roomId).emit("presence:update", users);
    });

    socket.on("chat:message", (payload = {}) => {
      const ok = requireFields(payload, ["roomId", "userId", "message"]);
      if (!ok) return;
      const out = {
        userId: payload.userId,
        message: payload.message,
        ts: payload.ts || Date.now(),
      };
      io.to(payload.roomId).emit("chat:message", out);
    });

    socket.on('points:award', (payload = {}) => {
      const ok = requireFields(payload, ['roomId', 'fromUserId', 'toUserId', 'points']);
      if (!ok) return socket.emit('points:error', { message: 'invalid points payload' });

      const { roomId, fromUserId, fromUsername, toUserId, toUsername, points } = payload;

      // basic validation
      if (fromUserId === toUserId) return socket.emit('points:error', { message: 'cannot award points to yourself' });
      const pts = Number(points) || 0;
      if (pts <= 0 || pts > 10) return socket.emit('points:error', { message: 'points must be between 1 and 10' });

      const now = Date.now();
      if (now - lastAwardTs < 3000) return socket.emit('points:error', { message: 'rate limited: wait before awarding again' });
      lastAwardTs = now;

      // update leaderboard
      roomService.addPoints(roomId, toUserId, toUsername || 'unknown', pts);
      const leaderboard = roomService.getLeaderboard(roomId);
      io.to(roomId).emit('points:update', { roomId, leaderboard });
    });

    // WebRTC signaling
    socket.on("webrtc:offer", (payload = {}) => {
      const { to } = payload;
      if (to) io.to(to).emit("webrtc:offer", { ...payload, from: socket.id });
    });

    socket.on("webrtc:answer", (payload = {}) => {
      const { to } = payload;
      if (to) io.to(to).emit("webrtc:answer", { ...payload, from: socket.id });
    });

    socket.on("webrtc:ice", (payload = {}) => {
      const { to } = payload;
      if (to) io.to(to).emit("webrtc:ice", { ...payload, from: socket.id });
    });

    socket.on("disconnect", () => {
      roomService.removeUserBySocket(socket.id);
      for (const [roomId] of roomService.rooms) {
        const users = roomService.getUsers(roomId);
        io.to(roomId).emit("presence:update", users);
      }
    });
  }

  return { register };
}

module.exports = { createSocketController };
