const mongoose = require("mongoose");

const whiteboardSchema = new mongoose.Schema({
  // Unique ID for the whiteboard (used in URLs)
  whiteboardId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Optional room reference
  roomId: {
    type: String,
    default: null,
  },

  // Excalidraw elements array (the actual drawing data)
  elements: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  // Excalidraw app state (settings, view, etc.)
  appState: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Metadata
  version: {
    type: Number,
    default: 1,
  },

  // Creator info (optional - for future auth)
  createdBy: {
    type: String,
    default: null,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Optional: Expiration (for auto-cleanup)
  expiresAt: {
    type: Date,
    default: null,
  },

  // Stats
  viewCount: {
    type: Number,
    default: 0,
  },

  // Soft delete flag
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

// Index for efficient queries
whiteboardSchema.index({ createdAt: -1 });
whiteboardSchema.index({ roomId: 1, createdAt: -1 });
whiteboardSchema.index({ isDeleted: 1 });

// TTL index for auto-expiration (optional)
whiteboardSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update timestamp on save
whiteboardSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);

module.exports = Whiteboard;
