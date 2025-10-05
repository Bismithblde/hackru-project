const Room = require("../models/Room");

/**
 * MongoDB-based Room Service
 * Handles all room operations with MongoDB persistence
 */

class MongoRoomService {
  /**
   * Create a new room
   */
  async createRoom({
    name,
    createdBy,
    description = "",
    maxParticipants = 10,
    settings = {},
  }) {
    try {
      const code = await Room.generateUniqueCode();

      const room = new Room({
        code,
        name,
        createdBy,
        description,
        maxParticipants,
        settings: {
          isPublic: settings.isPublic !== false,
          allowChat: settings.allowChat !== false,
          allowWhiteboard: settings.allowWhiteboard !== false,
          allowVideo: settings.allowVideo !== false,
          allowQuiz: settings.allowQuiz !== false,
        },
        participants: [],
        isActive: true,
      });

      await room.save();
      console.log(
        `[MongoRoomService] ✅ Created room: ${code} (${name}) by ${createdBy}`
      );

      return this.formatRoomResponse(room);
    } catch (error) {
      console.error("[MongoRoomService] Error creating room:", error);
      throw error;
    }
  }

  /**
   * Get room by code
   */
  async getRoom(code) {
    try {
      const room = await Room.findOne({ code, isActive: true });

      if (!room) {
        return null;
      }

      return this.formatRoomResponse(room);
    } catch (error) {
      console.error("[MongoRoomService] Error getting room:", error);
      throw error;
    }
  }

  /**
   * Get all active rooms
   */
  async getAllRooms(limit = 100) {
    try {
      const rooms = await Room.findActive().limit(limit);
      return rooms.map((room) => this.formatRoomResponse(room));
    } catch (error) {
      console.error("[MongoRoomService] Error getting all rooms:", error);
      throw error;
    }
  }

  /**
   * Get rooms by creator
   */
  async getRoomsByCreator(createdBy) {
    try {
      const rooms = await Room.findByCreator(createdBy);
      return rooms.map((room) => this.formatRoomResponse(room));
    } catch (error) {
      console.error(
        "[MongoRoomService] Error getting rooms by creator:",
        error
      );
      throw error;
    }
  }

  /**
   * Join a room (add participant)
   */
  async joinRoom(code, userId, username) {
    try {
      const room = await Room.findOne({ code, isActive: true });

      if (!room) {
        throw new Error("Room not found");
      }

      room.addParticipant(userId, username);
      await room.save();

      console.log(`[MongoRoomService] ✅ ${username} joined room ${code}`);

      return this.formatRoomResponse(room);
    } catch (error) {
      console.error("[MongoRoomService] Error joining room:", error);
      throw error;
    }
  }

  /**
   * Leave a room (remove participant)
   */
  async leaveRoom(code, userId) {
    try {
      const room = await Room.findOne({ code, isActive: true });

      if (!room) {
        return null;
      }

      room.removeParticipant(userId);
      await room.save();

      console.log(`[MongoRoomService] ✅ User ${userId} left room ${code}`);

      return this.formatRoomResponse(room);
    } catch (error) {
      console.error("[MongoRoomService] Error leaving room:", error);
      throw error;
    }
  }

  /**
   * Update room activity timestamp
   */
  async updateActivity(code) {
    try {
      const room = await Room.findOne({ code, isActive: true });

      if (!room) {
        return null;
      }

      room.updateActivity();
      await room.save();

      return this.formatRoomResponse(room);
    } catch (error) {
      console.error("[MongoRoomService] Error updating activity:", error);
      throw error;
    }
  }

  /**
   * Increment message count
   */
  async incrementMessages(code) {
    try {
      const room = await Room.findOne({ code, isActive: true });

      if (room) {
        room.incrementMessages();
        await room.save();
      }

      return room;
    } catch (error) {
      console.error("[MongoRoomService] Error incrementing messages:", error);
      // Don't throw - this is non-critical
      return null;
    }
  }

  /**
   * Increment quiz count
   */
  async incrementQuizzes(code) {
    try {
      const room = await Room.findOne({ code, isActive: true });

      if (room) {
        room.incrementQuizzes();
        await room.save();
      }

      return room;
    } catch (error) {
      console.error("[MongoRoomService] Error incrementing quizzes:", error);
      // Don't throw - this is non-critical
      return null;
    }
  }

  /**
   * Delete/deactivate a room
   */
  async deleteRoom(code) {
    try {
      const room = await Room.findOne({ code });

      if (!room) {
        return false;
      }

      // Soft delete - just mark as inactive
      room.isActive = false;
      await room.save();

      console.log(`[MongoRoomService] ✅ Deactivated room ${code}`);

      return true;
    } catch (error) {
      console.error("[MongoRoomService] Error deleting room:", error);
      throw error;
    }
  }

  /**
   * Get room statistics
   */
  async getRoomStats(code) {
    try {
      const room = await Room.findOne({ code, isActive: true });

      if (!room) {
        return null;
      }

      const activeParticipants = room.participants.filter((p) => p.isActive);

      return {
        code: room.code,
        name: room.name,
        createdBy: room.createdBy,
        participantCount: activeParticipants.length,
        maxParticipants: room.maxParticipants,
        totalJoins: room.analytics.totalJoins,
        totalMessages: room.analytics.totalMessages,
        totalQuizzes: room.analytics.totalQuizzes,
        createdAt: room.createdAt,
        lastActivityAt: room.lastActivityAt,
        activeParticipants: activeParticipants.map((p) => ({
          username: p.username,
          joinedAt: p.joinedAt,
          lastSeen: p.lastSeen,
        })),
      };
    } catch (error) {
      console.error("[MongoRoomService] Error getting room stats:", error);
      throw error;
    }
  }

  /**
   * Update participant's last seen timestamp
   */
  async updateParticipantLastSeen(code, userId) {
    try {
      const room = await Room.findOne({ code, isActive: true });

      if (!room) {
        return null;
      }

      const participant = room.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.lastSeen = new Date();
        await room.save();
      }

      return room;
    } catch (error) {
      console.error("[MongoRoomService] Error updating last seen:", error);
      // Don't throw - this is non-critical
      return null;
    }
  }

  /**
   * Clean up inactive participants (haven't been seen in X minutes)
   */
  async cleanupInactiveParticipants(code, inactiveMinutes = 30) {
    try {
      const room = await Room.findOne({ code, isActive: true });

      if (!room) {
        return null;
      }

      const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);
      let cleanedCount = 0;

      room.participants.forEach((participant) => {
        if (participant.isActive && participant.lastSeen < cutoffTime) {
          participant.isActive = false;
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        await room.save();
        console.log(
          `[MongoRoomService] Cleaned ${cleanedCount} inactive participants from room ${code}`
        );
      }

      return { cleanedCount, room: this.formatRoomResponse(room) };
    } catch (error) {
      console.error(
        "[MongoRoomService] Error cleaning up participants:",
        error
      );
      return null;
    }
  }

  /**
   * Format room response (consistent format)
   */
  formatRoomResponse(room) {
    if (!room) return null;

    const activeParticipants = room.participants.filter((p) => p.isActive);

    return {
      id: room.code,
      code: room.code,
      name: room.name,
      createdBy: room.createdBy,
      description: room.description,
      createdAt: room.createdAt.getTime(),
      lastActivityAt: room.lastActivityAt.getTime(),
      maxParticipants: room.maxParticipants,
      participantCount: activeParticipants.length,
      participants: activeParticipants.map((p) => ({
        userId: p.userId,
        username: p.username,
        joinedAt: p.joinedAt.getTime(),
      })),
      settings: room.settings,
      analytics: room.analytics,
      isActive: room.isActive,
    };
  }
}

module.exports = new MongoRoomService();
