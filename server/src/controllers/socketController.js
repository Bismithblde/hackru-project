const { requireFields } = require("../utils/validator");

function createSocketController(io, roomService) {
  function register(socket) {
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
