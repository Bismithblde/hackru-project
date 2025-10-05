const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    // 6-digit room code (used in URLs)
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{6}$/,
    },

    // Room display name
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Username of room creator
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },

    // Room description (optional)
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // Maximum number of participants
    maxParticipants: {
      type: Number,
      default: 10,
      min: 2,
      max: 100,
    },

    // Current participants
    participants: [participantSchema],

    // Room settings
    settings: {
      isPublic: {
        type: Boolean,
        default: true,
      },
      allowChat: {
        type: Boolean,
        default: true,
      },
      allowWhiteboard: {
        type: Boolean,
        default: true,
      },
      allowVideo: {
        type: Boolean,
        default: true,
      },
      allowQuiz: {
        type: Boolean,
        default: true,
      },
    },

    // Room status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // When the room was last accessed
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    // Auto-delete inactive rooms after X days
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true,
    },

    // Analytics
    analytics: {
      totalJoins: {
        type: Number,
        default: 0,
      },
      totalMessages: {
        type: Number,
        default: 0,
      },
      totalQuizzes: {
        type: Number,
        default: 0,
      },
    },

    // Leaderboard - persisted points for room participants
    leaderboard: [
      {
        userId: {
          type: String,
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        points: {
          type: Number,
          default: 0,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
roomSchema.index({ createdAt: -1 });
roomSchema.index({ lastActivityAt: -1 });
roomSchema.index({ isActive: 1, createdAt: -1 });
roomSchema.index({ createdBy: 1, createdAt: -1 });

// TTL index - auto-delete expired rooms
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for participant count
roomSchema.virtual("participantCount").get(function () {
  return this.participants.filter((p) => p.isActive).length;
});

// Method to add a participant
roomSchema.methods.addParticipant = function (userId, username) {
  // Check if participant already exists
  const existing = this.participants.find((p) => p.userId === userId);

  if (existing) {
    // Reactivate if inactive
    existing.isActive = true;
    existing.lastSeen = new Date();
    return existing;
  }

  // Check if room is full
  const activeCount = this.participants.filter((p) => p.isActive).length;
  if (activeCount >= this.maxParticipants) {
    throw new Error("Room is full");
  }

  // Add new participant
  const participant = {
    userId,
    username,
    joinedAt: new Date(),
    isActive: true,
    lastSeen: new Date(),
  };

  this.participants.push(participant);
  this.analytics.totalJoins += 1;
  this.lastActivityAt = new Date();

  return participant;
};

// Method to remove a participant
roomSchema.methods.removeParticipant = function (userId) {
  const participant = this.participants.find((p) => p.userId === userId);

  if (participant) {
    participant.isActive = false;
    participant.lastSeen = new Date();
  }

  this.lastActivityAt = new Date();
  return participant;
};

// Method to update last activity
roomSchema.methods.updateActivity = function () {
  this.lastActivityAt = new Date();
  // Extend expiration by 7 days on activity
  this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

// Method to increment message count
roomSchema.methods.incrementMessages = function () {
  this.analytics.totalMessages += 1;
  this.updateActivity();
};

// Method to increment quiz count
roomSchema.methods.incrementQuizzes = function () {
  this.analytics.totalQuizzes += 1;
  this.updateActivity();
};

// Method to update leaderboard
roomSchema.methods.updateLeaderboard = function (userId, username, points) {
  const entry = this.leaderboard.find((e) => e.userId === userId);

  if (entry) {
    entry.points = points;
    entry.username = username; // Update username in case it changed
    entry.lastUpdated = new Date();
  } else {
    this.leaderboard.push({
      userId,
      username,
      points,
      lastUpdated: new Date(),
    });
  }

  // Sort leaderboard by points descending
  this.leaderboard.sort((a, b) => b.points - a.points);
  this.updateActivity();
};

// Method to get leaderboard
roomSchema.methods.getLeaderboard = function () {
  return this.leaderboard
    .map((entry) => ({
      userId: entry.userId,
      username: entry.username,
      points: entry.points,
    }))
    .sort((a, b) => b.points - a.points);
};

// Static method to find active rooms
roomSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ lastActivityAt: -1 }).limit(100);
};

// Static method to find by creator
roomSchema.statics.findByCreator = function (createdBy) {
  return this.find({ createdBy, isActive: true }).sort({ createdAt: -1 });
};

// Static method to generate unique code
roomSchema.statics.generateUniqueCode = async function () {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exists = await this.findOne({ code });

    if (!exists) {
      return code;
    }

    attempts++;
  }

  throw new Error(
    "Failed to generate unique room code after multiple attempts"
  );
};

// Pre-save middleware to ensure virtuals are included
roomSchema.set("toJSON", { virtuals: true });
roomSchema.set("toObject", { virtuals: true });

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
