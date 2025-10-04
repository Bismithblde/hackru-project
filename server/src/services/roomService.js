// roomService.js
// In-memory room manager service. Extracted for clarity and easier testing.

function createRoomService() {
  // Map roomId -> Map(socketId -> { socketId, userId, username })
  const rooms = new Map();

  function ensureRoom(roomId) {
    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    return rooms.get(roomId);
  }

  function addUser(roomId, user) {
    const room = ensureRoom(roomId);
    room.set(user.socketId, {
      socketId: user.socketId,
      userId: user.userId,
      username: user.username,
    });
  }

  function removeUser(roomId, socketId) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.delete(socketId);
    if (room.size === 0) rooms.delete(roomId);
  }

  function removeUserBySocket(socketId) {
    for (const [roomId, map] of rooms.entries()) {
      if (map.has(socketId)) {
        map.delete(socketId);
        if (map.size === 0) rooms.delete(roomId);
      }
    }
  }

  function getUsers(roomId) {
    const room = rooms.get(roomId);
    if (!room) return [];
    // return array of users
    return Array.from(room.values()).map((u) => ({
      userId: u.userId,
      username: u.username,
      socketId: u.socketId,
    }));
  }

  return { rooms, addUser, removeUser, removeUserBySocket, getUsers };
}

module.exports = { createRoomService };
