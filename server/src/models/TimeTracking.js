const mongoose = require("mongoose");

const timeTrackingSchema = new mongoose.Schema({
  // Room identifier
  roomId: {
    type: String,
    required: true,
    index: true,
  },

  // User identifier
  userId: {
    type: String,
    required: true,
    index: true,
  },

  // Username for display
  username: {
    type: String,
    required: true,
  },

  // Session tracking
  sessionStart: {
    type: Date,
    required: true,
    default: Date.now,
  },

  sessionEnd: {
    type: Date,
    default: null,
  },

  // Duration in milliseconds
  duration: {
    type: Number,
    default: 0,
  },

  // Total time spent in this room by this user (across all sessions)
  totalTime: {
    type: Number,
    default: 0,
  },

  // Is this session currently active?
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  // Timestamps
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Compound index for quick lookups
timeTrackingSchema.index({ roomId: 1, userId: 1 });
timeTrackingSchema.index({ roomId: 1, isActive: 1 });

// Method to end a session and calculate duration
timeTrackingSchema.methods.endSession = function() {
  if (this.isActive) {
    this.sessionEnd = new Date();
    this.duration = this.sessionEnd - this.sessionStart;
    this.isActive = false;
  }
  return this;
};

const TimeTracking = mongoose.model("TimeTracking", timeTrackingSchema);

module.exports = TimeTracking;
