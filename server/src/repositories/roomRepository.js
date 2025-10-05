const { redis, isRedisAvailable } = require("../config/redis");

const KEYS = {
  ROOM: (code) => `room:${code}`,
  ROOM_MESSAGES: (code) => `room:${code}:messages`,
  ROOM_WHITEBOARD: (code) => `room:${code}:whiteboard`,
  ROOM_PARTICIPANTS: (code) => `room:${code}:participants`,
  ALL_ROOMS: "rooms:active",
};

const MESSAGE_HISTORY_LIMIT = 100;
const ROOM_TTL = 24 * 60 * 60;

class RoomRepository {
  async saveRoom(roomData, ttl = ROOM_TTL) {
    if (!isRedisAvailable()) return roomData;
    try {
      const { code } = roomData;
      await redis.hmset(KEYS.ROOM(code), roomData);
      await redis.expire(KEYS.ROOM(code), ttl);
      await redis.zadd(KEYS.ALL_ROOMS, roomData.createdAt || Date.now(), code);
      return roomData;
    } catch (error) {
      console.error("[RoomRepo] Save error:", error.message);
      return roomData;
    }
  }

  async getRoom(code) {
    if (!isRedisAvailable()) return null;
    try {
      const roomData = await redis.hgetall(KEYS.ROOM(code));
      if (!roomData || Object.keys(roomData).length === 0) return null;
      return {
        ...roomData,
        participantCount: parseInt(roomData.participantCount || "0", 10),
        createdAt: parseInt(roomData.createdAt, 10),
      };
    } catch (error) {
      console.error("[RoomRepo] Get error:", error.message);
      return null;
    }
  }

  async getAllRooms() {
    if (!isRedisAvailable()) return [];
    try {
      const codes = await redis.zrevrange(KEYS.ALL_ROOMS, 0, -1);
      const rooms = await Promise.all(codes.map((code) => this.getRoom(code)));
      return rooms.filter((room) => room !== null);
    } catch (error) {
      console.error("[RoomRepo] GetAll error:", error.message);
      return [];
    }
  }

  async deleteRoom(code) {
    if (!isRedisAvailable()) return false;
    try {
      const pipeline = redis.pipeline();
      pipeline.del(KEYS.ROOM(code));
      pipeline.del(KEYS.ROOM_MESSAGES(code));
      pipeline.del(KEYS.ROOM_WHITEBOARD(code));
      pipeline.del(KEYS.ROOM_PARTICIPANTS(code));
      pipeline.zrem(KEYS.ALL_ROOMS, code);
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error("[RoomRepo] Delete error:", error.message);
      return false;
    }
  }

  async saveMessage(code, message) {
    if (!isRedisAvailable()) return message;
    try {
      const key = KEYS.ROOM_MESSAGES(code);
      await redis.lpush(key, JSON.stringify(message));
      await redis.ltrim(key, 0, MESSAGE_HISTORY_LIMIT - 1);
      await redis.expire(key, ROOM_TTL);
      return message;
    } catch (error) {
      console.error("[RoomRepo] SaveMessage error:", error.message);
      return message;
    }
  }

  async getMessages(code, limit = 50) {
    if (!isRedisAvailable()) return [];
    try {
      const messages = await redis.lrange(
        KEYS.ROOM_MESSAGES(code),
        0,
        limit - 1
      );
      return messages
        .map((msg) => {
          try {
            return JSON.parse(msg);
          } catch {
            return null;
          }
        })
        .filter((msg) => msg !== null)
        .reverse();
    } catch (error) {
      console.error("[RoomRepo] GetMessages error:", error.message);
      return [];
    }
  }

  async saveWhiteboard(code, whiteboardData) {
    if (!isRedisAvailable()) return whiteboardData;
    try {
      await redis.set(
        KEYS.ROOM_WHITEBOARD(code),
        JSON.stringify(whiteboardData)
      );
      await redis.expire(KEYS.ROOM_WHITEBOARD(code), ROOM_TTL);
      return whiteboardData;
    } catch (error) {
      console.error("[RoomRepo] SaveWhiteboard error:", error.message);
      return whiteboardData;
    }
  }

  async getWhiteboard(code) {
    if (!isRedisAvailable()) return null;
    try {
      const data = await redis.get(KEYS.ROOM_WHITEBOARD(code));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("[RoomRepo] GetWhiteboard error:", error.message);
      return null;
    }
  }

  async addParticipant(code, userId, username) {
    if (!isRedisAvailable()) return true;
    try {
      await redis.hset(KEYS.ROOM_PARTICIPANTS(code), userId, username);
      await redis.expire(KEYS.ROOM_PARTICIPANTS(code), ROOM_TTL);
      await redis.hincrby(KEYS.ROOM(code), "participantCount", 1);
      return true;
    } catch (error) {
      console.error("[RoomRepo] AddParticipant error:", error.message);
      return false;
    }
  }

  async removeParticipant(code, userId) {
    if (!isRedisAvailable()) return true;
    try {
      await redis.hdel(KEYS.ROOM_PARTICIPANTS(code), userId);
      await redis.hincrby(KEYS.ROOM(code), "participantCount", -1);
      return true;
    } catch (error) {
      console.error("[RoomRepo] RemoveParticipant error:", error.message);
      return false;
    }
  }

  async roomExists(code) {
    if (!isRedisAvailable()) return false;
    try {
      return (await redis.exists(KEYS.ROOM(code))) === 1;
    } catch (error) {
      console.error("[RoomRepo] RoomExists error:", error.message);
      return false;
    }
  }

  async refreshRoomTTL(code) {
    if (!isRedisAvailable()) return false;
    try {
      const pipeline = redis.pipeline();
      pipeline.expire(KEYS.ROOM(code), ROOM_TTL);
      pipeline.expire(KEYS.ROOM_MESSAGES(code), ROOM_TTL);
      pipeline.expire(KEYS.ROOM_WHITEBOARD(code), ROOM_TTL);
      pipeline.expire(KEYS.ROOM_PARTICIPANTS(code), ROOM_TTL);
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error("[RoomRepo] RefreshTTL error:", error.message);
      return false;
    }
  }

  async getParticipants(code) {
    if (!isRedisAvailable()) return {};
    try {
      return await redis.hgetall(KEYS.ROOM_PARTICIPANTS(code));
    } catch (error) {
      console.error("[RoomRepo] GetParticipants error:", error.message);
      return {};
    }
  }

  async getRoomStats(code) {
    if (!isRedisAvailable()) return {};
    try {
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
    } catch (error) {
      console.error("[RoomRepo] GetRoomStats error:", error.message);
      return {};
    }
  }
}

module.exports = new RoomRepository();
