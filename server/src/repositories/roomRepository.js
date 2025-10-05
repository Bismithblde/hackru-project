const { redis, isRedisAvailable } = require("../config/redis");const { redis, isRedisAvailable } = require("../config/redis");const { redis, isRedisAvailable } = require("../config/redis");



// Redis key patterns

const KEYS = {

  ROOM: (code) => `room:${code}`,/**/**

  ROOM_MESSAGES: (code) => `room:${code}:messages`,

  ROOM_WHITEBOARD: (code) => `room:${code}:whiteboard`, * Room Repository - Data access layer for Redis operations * Room Repository - Handles all room-related Redis operations

  ROOM_PARTICIPANTS: (code) => `room:${code}:participants`,

  ALL_ROOMS: "rooms:active", * All methods gracefully degrade if Redis is unavailable * Following Repository pattern for clean data access layer

};

 */ */

const MESSAGE_HISTORY_LIMIT = 100;

const ROOM_TTL = 24 * 60 * 60;



class RoomRepository {// Redis key patterns// Key prefixes for different data types

  async saveRoom(roomData, ttl = ROOM_TTL) {

    if (!isRedisAvailable()) return roomData;const KEYS = {const KEYS = {

    try {

      const { code } = roomData;  ROOM: (code) => `room:${code}`,  ROOM: (code) => `room:${code}`,

      await redis.hmset(KEYS.ROOM(code), roomData);

      await redis.expire(KEYS.ROOM(code), ttl);  ROOM_MESSAGES: (code) => `room:${code}:messages`,  ROOM_MESSAGES: (code) => `room:${code}:messages`,

      await redis.zadd(KEYS.ALL_ROOMS, roomData.createdAt || Date.now(), code);

      return roomData;  ROOM_WHITEBOARD: (code) => `room:${code}:whiteboard`,  ROOM_WHITEBOARD: (code) => `room:${code}:whiteboard`,

    } catch (error) {

      console.error("[RoomRepo] Save error:", error.message);  ROOM_PARTICIPANTS: (code) => `room:${code}:participants`,  ROOM_PARTICIPANTS: (code) => `room:${code}:participants`,

      return roomData;

    }  ALL_ROOMS: "rooms:active",  ALL_ROOMS: "rooms:active",

  }

};};

  async getRoom(code) {

    if (!isRedisAvailable()) return null;

    try {

      const roomData = await redis.hgetall(KEYS.ROOM(code));// Constants// Constants

      if (!roomData || Object.keys(roomData).length === 0) return null;

      return {const MESSAGE_HISTORY_LIMIT = 100;const MESSAGE_HISTORY_LIMIT = 100; // Store last 100 messages

        ...roomData,

        participantCount: parseInt(roomData.participantCount || "0", 10),const ROOM_TTL = 24 * 60 * 60; // 24 hoursconst ROOM_TTL = 24 * 60 * 60; // 24 hours in seconds

        createdAt: parseInt(roomData.createdAt, 10),

      };const WHITEBOARD_TTL = 24 * 60 * 60; // 24 hours

    } catch (error) {

      console.error("[RoomRepo] Get error:", error.message);class RoomRepository {

      return null;

    }  /**class RoomRepository {

  }

   * Save room to Redis  /**

  async getAllRooms() {

    if (!isRedisAvailable()) return [];   */   * Create a new room

    try {

      const codes = await redis.zrevrange(KEYS.ALL_ROOMS, 0, -1);  async saveRoom(roomData, ttl = ROOM_TTL) {   * @param {Object} roomData - Room data (code, name, createdBy, etc.)

      const rooms = await Promise.all(codes.map((code) => this.getRoom(code)));

      return rooms.filter((room) => room !== null);    if (!isRedisAvailable()) {   * @returns {Promise<Object>} Created room object

    } catch (error) {

      console.error("[RoomRepo] GetAll error:", error.message);      return roomData;   */

      return [];

    }    }  async createRoom(roomData) {

  }

    if (!isRedisAvailable()) {

  async deleteRoom(code) {

    if (!isRedisAvailable()) return false;    try {      console.warn("[RoomRepo] Redis unavailable, skipping persistence");

    try {

      const pipeline = redis.pipeline();      const { code } = roomData;      return roomData;

      pipeline.del(KEYS.ROOM(code));

      pipeline.del(KEYS.ROOM_MESSAGES(code));      const roomKey = KEYS.ROOM(code);    }

      pipeline.del(KEYS.ROOM_WHITEBOARD(code));

      pipeline.del(KEYS.ROOM_PARTICIPANTS(code));

      pipeline.zrem(KEYS.ALL_ROOMS, code);

      await pipeline.exec();      // Store as hash    const { code } = roomData;

      return true;

    } catch (error) {      await redis.hmset(roomKey, roomData);    const roomKey = KEYS.ROOM(code);

      console.error("[RoomRepo] Delete error:", error.message);

      return false;      await redis.expire(roomKey, ttl);

    }

  }    try {



  async saveMessage(code, message) {      // Add to sorted set      // Store room data as hash

    if (!isRedisAvailable()) return message;

    try {      await redis.zadd(KEYS.ALL_ROOMS, roomData.createdAt || Date.now(), code);      const roomToStore = {

      const key = KEYS.ROOM_MESSAGES(code);

      await redis.lpush(key, JSON.stringify(message));        ...roomData,

      await redis.ltrim(key, 0, MESSAGE_HISTORY_LIMIT - 1);

      await redis.expire(key, ROOM_TTL);      return roomData;        createdAt: roomData.createdAt || Date.now(),

      return message;

    } catch (error) {    } catch (error) {        participantCount: 0,

      console.error("[RoomRepo] SaveMessage error:", error.message);

      return message;      console.error("[RoomRepo] Error saving room:", error.message);      };

    }

  }      return roomData;



  async getMessages(code, limit = 50) {    }      await redis.hmset(roomKey, roomToStore);

    if (!isRedisAvailable()) return [];

    try {  }      await redis.expire(roomKey, ROOM_TTL);

      const messages = await redis.lrange(KEYS.ROOM_MESSAGES(code), 0, limit - 1);

      return messages

        .map((msg) => {

          try {  /**      // Add to active rooms set with score = createdAt for sorting

            return JSON.parse(msg);

          } catch {   * Get room by code      await redis.zadd(KEYS.ALL_ROOMS, roomData.createdAt, code);

            return null;

          }   */

        })

        .filter((msg) => msg !== null)  async getRoom(code) {      console.log(`[RoomRepo] Created room: ${code}`);

        .reverse();

    } catch (error) {    if (!isRedisAvailable()) {      return roomToStore;

      console.error("[RoomRepo] GetMessages error:", error.message);

      return [];      return null;    } catch (error) {

    }

  }    }      console.error("[RoomRepo] Error creating room:", error.message);



  async saveWhiteboard(code, whiteboardData) {      return roomData; // Return data anyway

    if (!isRedisAvailable()) return whiteboardData;

    try {    try {    }

      await redis.set(KEYS.ROOM_WHITEBOARD(code), JSON.stringify(whiteboardData));

      await redis.expire(KEYS.ROOM_WHITEBOARD(code), ROOM_TTL);      const roomData = await redis.hgetall(KEYS.ROOM(code));  }

      return whiteboardData;

    } catch (error) {      

      console.error("[RoomRepo] SaveWhiteboard error:", error.message);

      return whiteboardData;      if (!roomData || Object.keys(roomData).length === 0) {  /**

    }

  }        return null;   * Get room by code



  async getWhiteboard(code) {      }   * @param {string} code - Room code

    if (!isRedisAvailable()) return null;

    try {   * @returns {Promise<Object|null>} Room object or null

      const data = await redis.get(KEYS.ROOM_WHITEBOARD(code));

      return data ? JSON.parse(data) : null;      return {   */

    } catch (error) {

      console.error("[RoomRepo] GetWhiteboard error:", error.message);        ...roomData,  async getRoom(code) {

      return null;

    }        participantCount: parseInt(roomData.participantCount || "0", 10),    if (!isRedisAvailable()) {

  }

        createdAt: parseInt(roomData.createdAt, 10),      return null;

  async addParticipant(code, userId, username) {

    if (!isRedisAvailable()) return true;      };    }

    try {

      await redis.hset(KEYS.ROOM_PARTICIPANTS(code), userId, username);    } catch (error) {

      await redis.expire(KEYS.ROOM_PARTICIPANTS(code), ROOM_TTL);

      await redis.hincrby(KEYS.ROOM(code), "participantCount", 1);      console.error("[RoomRepo] Error getting room:", error.message);    try {

      return true;

    } catch (error) {      return null;      const roomKey = KEYS.ROOM(code);

      console.error("[RoomRepo] AddParticipant error:", error.message);

      return false;    }      const roomData = await redis.hgetall(roomKey);

    }

  }  }



  async removeParticipant(code, userId) {      if (!roomData || Object.keys(roomData).length === 0) {

    if (!isRedisAvailable()) return true;

    try {  /**        return null;

      await redis.hdel(KEYS.ROOM_PARTICIPANTS(code), userId);

      await redis.hincrby(KEYS.ROOM(code), "participantCount", -1);   * Get all active rooms      }

      return true;

    } catch (error) {   */

      console.error("[RoomRepo] RemoveParticipant error:", error.message);

      return false;  async getAllRooms() {      return {

    }

  }    if (!isRedisAvailable()) {        ...roomData,



  async roomExists(code) {      return [];        participantCount: parseInt(roomData.participantCount || "0", 10),

    if (!isRedisAvailable()) return false;

    try {    }        createdAt: parseInt(roomData.createdAt, 10),

      return (await redis.exists(KEYS.ROOM(code))) === 1;

    } catch (error) {      };

      console.error("[RoomRepo] RoomExists error:", error.message);

      return false;    try {    } catch (error) {

    }

  }      const codes = await redis.zrevrange(KEYS.ALL_ROOMS, 0, -1);      console.error("[RoomRepo] Error getting room:", error.message);



  async refreshRoomTTL(code) {      const rooms = await Promise.all(      return null;

    if (!isRedisAvailable()) return false;

    try {        codes.map((code) => this.getRoom(code))    }

      const pipeline = redis.pipeline();

      pipeline.expire(KEYS.ROOM(code), ROOM_TTL);      );  }

      pipeline.expire(KEYS.ROOM_MESSAGES(code), ROOM_TTL);

      pipeline.expire(KEYS.ROOM_WHITEBOARD(code), ROOM_TTL);      return rooms.filter((room) => room !== null);

      pipeline.expire(KEYS.ROOM_PARTICIPANTS(code), ROOM_TTL);

      await pipeline.exec();    } catch (error) {  /**

      return true;

    } catch (error) {      console.error("[RoomRepo] Error getting all rooms:", error.message);   * Get all active rooms

      console.error("[RoomRepo] RefreshTTL error:", error.message);

      return false;      return [];   * @returns {Promise<Array>} Array of room objects

    }

  }    }   */

}

  }  async getAllRooms() {

module.exports = new RoomRepository();

    if (!isRedisAvailable()) {

  /**      return [];

   * Delete room and all related data    }

   */

  async deleteRoom(code) {    try {

    if (!isRedisAvailable()) {      // Get all room codes from sorted set (most recent first)

      return false;      const codes = await redis.zrevrange(KEYS.ALL_ROOMS, 0, -1);

    }

      const rooms = await Promise.all(

    try {        codes.map(async (code) => {

      const pipeline = redis.pipeline();          return await this.getRoom(code);

      pipeline.del(KEYS.ROOM(code));        })

      pipeline.del(KEYS.ROOM_MESSAGES(code));      );

      pipeline.del(KEYS.ROOM_WHITEBOARD(code));

      pipeline.del(KEYS.ROOM_PARTICIPANTS(code));      return rooms.filter((room) => room !== null);

      pipeline.zrem(KEYS.ALL_ROOMS, code);    } catch (error) {

      await pipeline.exec();      console.error("[RoomRepo] Error getting all rooms:", error.message);

      return true;      return [];

    } catch (error) {    }

      console.error("[RoomRepo] Error deleting room:", error.message);  }

      return false;

    }  /**

  }   * Delete a room and all its data

   * @param {string} code - Room code

  /**   * @returns {Promise<boolean>} Success status

   * Save a chat message   */

   */  async deleteRoom(code) {

  async saveMessage(code, message) {    if (!isRedisAvailable()) {

    if (!isRedisAvailable()) {      return false;

      return message;    }

    }

    try {

    try {      const pipeline = redis.pipeline();

      const messageKey = KEYS.ROOM_MESSAGES(code);

      const messageData = JSON.stringify(message);      pipeline.del(KEYS.ROOM(code));

      pipeline.del(KEYS.ROOM_MESSAGES(code));

      // Add to list (prepend so newest are first)      pipeline.del(KEYS.ROOM_WHITEBOARD(code));

      await redis.lpush(messageKey, messageData);    pipeline.del(KEYS.ROOM_PARTICIPANTS(code));

          pipeline.zrem(KEYS.ALL_ROOMS, code);

      // Trim to keep only last 100 messages

      await redis.ltrim(messageKey, 0, MESSAGE_HISTORY_LIMIT - 1);    await pipeline.exec();

      

      // Set expiration    console.log(`[RoomRepo] Deleted room: ${code}`);

      await redis.expire(messageKey, ROOM_TTL);    return true;

  }

      return message;

    } catch (error) {  /**

      console.error("[RoomRepo] Error saving message:", error.message);   * Update room participant count

      return message;   * @param {string} code - Room code

    }   * @param {number} count - New participant count

  }   */

  async updateParticipantCount(code, count) {

  /**    const roomKey = KEYS.ROOM(code);

   * Get message history    await redis.hset(roomKey, "participantCount", count);

   */  }

  async getMessages(code, limit = 50) {

    if (!isRedisAvailable()) {  /**

      return [];   * Add participant to room

    }   * @param {string} code - Room code

   * @param {string} userId - User ID

    try {   * @param {string} username - Username

      const messageKey = KEYS.ROOM_MESSAGES(code);   */

      const messages = await redis.lrange(messageKey, 0, limit - 1);  async addParticipant(code, userId, username) {

          const participantsKey = KEYS.ROOM_PARTICIPANTS(code);

      // Parse JSON and reverse (oldest first)    await redis.hset(participantsKey, userId, username);

      return messages    await redis.expire(participantsKey, ROOM_TTL);

        .map((msg) => {

          try {    // Update count

            return JSON.parse(msg);    const count = await redis.hlen(participantsKey);

          } catch (e) {    await this.updateParticipantCount(code, count);

            return null;

          }    console.log(`[RoomRepo] Added participant ${username} to room ${code}`);

        })  }

        .filter((msg) => msg !== null)

        .reverse();  /**

    } catch (error) {   * Remove participant from room

      console.error("[RoomRepo] Error getting messages:", error.message);   * @param {string} code - Room code

      return [];   * @param {string} userId - User ID

    }   */

  }  async removeParticipant(code, userId) {

    const participantsKey = KEYS.ROOM_PARTICIPANTS(code);

  /**    await redis.hdel(participantsKey, userId);

   * Save whiteboard state

   */    // Update count

  async saveWhiteboard(code, whiteboardData) {    const count = await redis.hlen(participantsKey);

    if (!isRedisAvailable()) {    await this.updateParticipantCount(code, count);

      return whiteboardData;

    }    console.log(`[RoomRepo] Removed participant ${userId} from room ${code}`);

  }

    try {

      const whiteboardKey = KEYS.ROOM_WHITEBOARD(code);  /**

      await redis.set(whiteboardKey, JSON.stringify(whiteboardData));   * Get all participants in a room

      await redis.expire(whiteboardKey, ROOM_TTL);   * @param {string} code - Room code

      return whiteboardData;   * @returns {Promise<Object>} Map of userId -> username

    } catch (error) {   */

      console.error("[RoomRepo] Error saving whiteboard:", error.message);  async getParticipants(code) {

      return whiteboardData;    const participantsKey = KEYS.ROOM_PARTICIPANTS(code);

    }    return await redis.hgetall(participantsKey);

  }  }



  /**  /**

   * Get whiteboard state   * Save a chat message

   */   * @param {string} code - Room code

  async getWhiteboard(code) {   * @param {Object} message - Message object

    if (!isRedisAvailable()) {   */

      return null;  async saveMessage(code, message) {

    }    const messagesKey = KEYS.ROOM_MESSAGES(code);



    try {    // Store as JSON in a list (most recent at the head)

      const whiteboardKey = KEYS.ROOM_WHITEBOARD(code);    await redis.lpush(messagesKey, JSON.stringify(message));

      const data = await redis.get(whiteboardKey);

          // Trim to keep only last N messages

      if (!data) {    await redis.ltrim(messagesKey, 0, MESSAGE_HISTORY_LIMIT - 1);

        return null;

      }    // Set expiry

    await redis.expire(messagesKey, ROOM_TTL);

      return JSON.parse(data);

    } catch (error) {    console.log(`[RoomRepo] Saved message in room ${code}`);

      console.error("[RoomRepo] Error getting whiteboard:", error.message);  }

      return null;

    }  /**

  }   * Get message history for a room

   * @param {string} code - Room code

  /**   * @param {number} limit - Number of messages to retrieve (default: 50)

   * Add participant to room   * @returns {Promise<Array>} Array of message objects (oldest first)

   */   */

  async addParticipant(code, userId, username) {  async getMessages(code, limit = 50) {

    if (!isRedisAvailable()) {    const messagesKey = KEYS.ROOM_MESSAGES(code);

      return true;

    }    // Get messages (most recent first from Redis)

    const messages = await redis.lrange(messagesKey, 0, limit - 1);

    try {

      const participantKey = KEYS.ROOM_PARTICIPANTS(code);    // Parse JSON and reverse to get oldest first

      await redis.hset(participantKey, userId, username);    return messages

      await redis.expire(participantKey, ROOM_TTL);      .map((msg) => {

              try {

      // Increment count          return JSON.parse(msg);

      await redis.hincrby(KEYS.ROOM(code), "participantCount", 1);        } catch (error) {

                console.error("[RoomRepo] Error parsing message:", error);

      return true;          return null;

    } catch (error) {        }

      console.error("[RoomRepo] Error adding participant:", error.message);      })

      return false;      .filter((msg) => msg !== null)

    }      .reverse(); // Oldest first for chat display

  }  }



  /**  /**

   * Remove participant from room   * Save whiteboard state

   */   * @param {string} code - Room code

  async removeParticipant(code, userId) {   * @param {Object} whiteboardData - Whiteboard state object

    if (!isRedisAvailable()) {   */

      return true;  async saveWhiteboard(code, whiteboardData) {

    }    const whiteboardKey = KEYS.ROOM_WHITEBOARD(code);



    try {    await redis.set(whiteboardKey, JSON.stringify(whiteboardData));

      const participantKey = KEYS.ROOM_PARTICIPANTS(code);    await redis.expire(whiteboardKey, WHITEBOARD_TTL);

      await redis.hdel(participantKey, userId);

          console.log(`[RoomRepo] Saved whiteboard state for room ${code}`);

      // Decrement count  }

      await redis.hincrby(KEYS.ROOM(code), "participantCount", -1);

        /**

      return true;   * Get whiteboard state

    } catch (error) {   * @param {string} code - Room code

      console.error("[RoomRepo] Error removing participant:", error.message);   * @returns {Promise<Object|null>} Whiteboard state or null

      return false;   */

    }  async getWhiteboard(code) {

  }    const whiteboardKey = KEYS.ROOM_WHITEBOARD(code);

    const data = await redis.get(whiteboardKey);

  /**

   * Check if room exists    if (!data) return null;

   */

  async roomExists(code) {    try {

    if (!isRedisAvailable()) {      return JSON.parse(data);

      return false;    } catch (error) {

    }      console.error("[RoomRepo] Error parsing whiteboard data:", error);

      return null;

    try {    }

      const exists = await redis.exists(KEYS.ROOM(code));  }

      return exists === 1;

    } catch (error) {  /**

      console.error("[RoomRepo] Error checking room existence:", error.message);   * Check if room exists

      return false;   * @param {string} code - Room code

    }   * @returns {Promise<boolean>}

  }   */

  async roomExists(code) {

  /**    const roomKey = KEYS.ROOM(code);

   * Refresh room TTL (extend expiration)    return (await redis.exists(roomKey)) === 1;

   */  }

  async refreshRoomTTL(code) {

    if (!isRedisAvailable()) {  /**

      return false;   * Refresh room TTL (extend expiration)

    }   * @param {string} code - Room code

   */

    try {  async refreshRoomTTL(code) {

      const pipeline = redis.pipeline();    const pipeline = redis.pipeline();

      pipeline.expire(KEYS.ROOM(code), ROOM_TTL);

      pipeline.expire(KEYS.ROOM_MESSAGES(code), ROOM_TTL);    pipeline.expire(KEYS.ROOM(code), ROOM_TTL);

      pipeline.expire(KEYS.ROOM_WHITEBOARD(code), ROOM_TTL);    pipeline.expire(KEYS.ROOM_MESSAGES(code), ROOM_TTL);

      pipeline.expire(KEYS.ROOM_PARTICIPANTS(code), ROOM_TTL);    pipeline.expire(KEYS.ROOM_WHITEBOARD(code), ROOM_TTL);

      await pipeline.exec();    pipeline.expire(KEYS.ROOM_PARTICIPANTS(code), ROOM_TTL);

      return true;

    } catch (error) {    await pipeline.exec();

      console.error("[RoomRepo] Error refreshing TTL:", error.message);  }

      return false;

    }  /**

  }   * Get room statistics

}   * @param {string} code - Room code

   * @returns {Promise<Object>} Room stats

module.exports = new RoomRepository();   */

  async getRoomStats(code) {
    const pipeline = redis.pipeline();

    pipeline.hgetall(KEYS.ROOM(code));
    pipeline.llen(KEYS.ROOM_MESSAGES(code));
    pipeline.hlen(KEYS.ROOM_PARTICIPANTS(code));
    pipeline.ttl(KEYS.ROOM(code));

    const results = await pipeline.exec();

    return {
      room: results[0][1] || {},
      messageCount: results[1][1] || 0,
      participantCount: results[2][1] || 0,
      ttl: results[3][1] || 0,
    };
  }
}

// Export singleton instance
module.exports = new RoomRepository();
