const roomRepository = require("../repositories/roomRepository");
const { isRedisAvailable } = require("../config/redis");

/**
 * Room Service - Business logic for room operations
 * Separates business logic from data access and routes
 */

class RoomService {
  /**
   * Generate a unique 6-digit room code
   * @returns {Promise<string>} Unique room code
   */
  async generateUniqueCode() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await roomRepository.roomExists(code);

      if (!exists) {
        return code;
      }

      attempts++;
    }

    throw new Error(
      "Failed to generate unique room code after multiple attempts"
    );
  }

  /**
   * Create a new room
   * @param {Object} data - Room creation data
   * @returns {Promise<Object>} Created room
   */
  async createRoom(data) {
    const { name, createdBy, maxParticipants = 10 } = data;

    if (!name || !createdBy) {
      throw new Error("Room name and creator are required");
    }

    const code = await this.generateUniqueCode();

    const roomData = {
      id: code,
      code,
      name: name.trim(),
      createdBy: createdBy.trim(),
      createdAt: Date.now(),
      participantCount: 0,
      maxParticipants,
    };

    const room = await roomRepository.createRoom(roomData);

    console.log(`[RoomService] Created room: ${code} - ${name}`);

    return room;
  }

  /**
   * Join a room
   * @param {string} code - Room code
   * @param {string} userId - User ID
   * @param {string} username - Username
   * @returns {Promise<Object>} Room object with message history
   */
  async joinRoom(code, userId, username) {
    const room = await roomRepository.getRoom(code);

    if (!room) {
      throw new Error("Room not found");
    }

    // Add participant
    await roomRepository.addParticipant(code, userId, username);

    // Refresh room TTL on activity
    await roomRepository.refreshRoomTTL(code);

    // Get message history for the user
    const messages = await roomRepository.getMessages(code, 50);

    // Get whiteboard state
    const whiteboard = await roomRepository.getWhiteboard(code);

    console.log(`[RoomService] User ${username} joined room ${code}`);

    return {
      room,
      messages,
      whiteboard,
    };
  }

  /**
   * Leave a room
   * @param {string} code - Room code
   * @param {string} userId - User ID
   */
  async leaveRoom(code, userId) {
    await roomRepository.removeParticipant(code, userId);

    // Check if room is empty, if so, schedule for deletion
    const participants = await roomRepository.getParticipants(code);

    if (Object.keys(participants).length === 0) {
      console.log(`[RoomService] Room ${code} is empty, will expire naturally`);
    }
  }

  /**
   * Get a room by code
   * @param {string} code - Room code
   * @returns {Promise<Object|null>} Room object
   */
  async getRoom(code) {
    return await roomRepository.getRoom(code);
  }

  /**
   * Get all active rooms
   * @returns {Promise<Array>} Array of rooms
   */
  async getAllRooms() {
    return await roomRepository.getAllRooms();
  }

  /**
   * Delete a room
   * @param {string} code - Room code
   */
  async deleteRoom(code) {
    await roomRepository.deleteRoom(code);
    console.log(`[RoomService] Deleted room ${code}`);
  }

  /**
   * Save a chat message
   * @param {string} code - Room code
   * @param {Object} messageData - Message data
   */
  async saveMessage(code, messageData) {
    const room = await roomRepository.getRoom(code);

    if (!room) {
      throw new Error("Room not found");
    }

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId: code,
      userId: messageData.userId,
      username: messageData.username,
      message: messageData.message,
      timestamp: messageData.timestamp || Date.now(),
    };

    await roomRepository.saveMessage(code, message);

    // Refresh room TTL on activity
    await roomRepository.refreshRoomTTL(code);

    return message;
  }

  /**
   * Get message history
   * @param {string} code - Room code
   * @param {number} limit - Number of messages
   * @returns {Promise<Array>} Messages array
   */
  async getMessages(code, limit = 50) {
    return await roomRepository.getMessages(code, limit);
  }

  /**
   * Save whiteboard state
   * @param {string} code - Room code
   * @param {Object} whiteboardData - Whiteboard state
   */
  async saveWhiteboard(code, whiteboardData) {
    const room = await roomRepository.getRoom(code);

    if (!room) {
      throw new Error("Room not found");
    }

    await roomRepository.saveWhiteboard(code, whiteboardData);

    // Refresh room TTL on activity
    await roomRepository.refreshRoomTTL(code);
  }

  /**
   * Get whiteboard state
   * @param {string} code - Room code
   * @returns {Promise<Object|null>} Whiteboard state
   */
  async getWhiteboard(code) {
    return await roomRepository.getWhiteboard(code);
  }

  /**
   * Get room statistics
   * @param {string} code - Room code
   * @returns {Promise<Object>} Room stats
   */
  async getRoomStats(code) {
    return await roomRepository.getRoomStats(code);
  }
}

module.exports = new RoomService();
