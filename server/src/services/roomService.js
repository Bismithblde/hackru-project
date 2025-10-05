// roomService.js
// In-memory room manager service. Extracted for clarity and easier testing.

function createRoomService() {
  // Map roomId -> Map(socketId -> { socketId, userId, username })
  const rooms = new Map();

  // Performance optimization: O(1) socket-to-room lookup
  const socketToRoom = new Map(); // socketId -> roomId
  
  // Cleanup callbacks when room becomes empty
  const cleanupCallbacks = [];

  function ensureRoom(roomId) {
    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    return rooms.get(roomId);
  }
  
  function onRoomEmpty(callback) {
    cleanupCallbacks.push(callback);
  }
  
  function notifyRoomEmpty(roomId) {
    cleanupCallbacks.forEach(cb => cb(roomId));
  }

  function addUser(roomId, user) {
    const room = ensureRoom(roomId);
    room.set(user.socketId, {
      socketId: user.socketId,
      userId: user.userId,
      username: user.username,
    });

    // Add to index for O(1) removal
    socketToRoom.set(user.socketId, roomId);
  }

  function removeUser(roomId, socketId) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.delete(socketId);
    socketToRoom.delete(socketId);

    if (room.size === 0) {
      rooms.delete(roomId);
      notifyRoomEmpty(roomId);
    }
  }

  function removeUserBySocket(socketId) {
    // O(1) lookup instead of O(n) loop!
    const roomId = socketToRoom.get(socketId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (room) {
      const userInfo = room.get(socketId);
      room.delete(socketId);
      if (room.size === 0) {
        rooms.delete(roomId);
        notifyRoomEmpty(roomId);
      }
      socketToRoom.delete(socketId);
      return userInfo;
    }

    socketToRoom.delete(socketId);
  }

  function getUsers(roomId) {
    const room = rooms.get(roomId);
    if (!room) return [];

    // Single-pass iteration (optimized)
    const users = [];
    for (const user of room.values()) {
      users.push({
        userId: user.userId,
        username: user.username,
        socketId: user.socketId,
      });
    }
    return users;
  }

  // Leaderboard: Map roomId -> Map(userId -> { userId, username, points })
  const leaderboards = new Map();

  function ensureLeaderboard(roomId) {
    if (!leaderboards.has(roomId)) leaderboards.set(roomId, new Map());
    return leaderboards.get(roomId);
  }

  function addPoints(roomId, userId, username, points) {
    const lb = ensureLeaderboard(roomId);
    const cur = lb.get(userId) || { userId, username, points: 0 };
    cur.points = (cur.points || 0) + points;
    cur.username = username || cur.username;
    lb.set(userId, cur);
    return cur;
  }

  function setPoints(roomId, userId, username, points) {
    const lb = ensureLeaderboard(roomId);
    lb.set(userId, { userId, username, points });
  }

  function getLeaderboard(roomId, top = 10) {
    const lb = leaderboards.get(roomId);
    if (!lb) return [];
    const arr = Array.from(lb.values());
    arr.sort((a, b) => b.points - a.points);
    return arr.slice(0, top);
  }

  return {
    rooms,
    addUser,
    removeUser,
    removeUserBySocket,
    getUsers,
    addPoints,
    setPoints,
    getLeaderboard,
    onRoomEmpty,
  };
}

module.exports = { createRoomService };
