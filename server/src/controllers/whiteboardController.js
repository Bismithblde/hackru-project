const crypto = require("crypto");
const Whiteboard = require("../models/Whiteboard");
const { isDBConnected } = require("../config/database");

/**
 * Save a whiteboard and return a unique ID
 */
async function saveWhiteboard(req, res) {
  // Check if MongoDB is connected
  if (!isDBConnected()) {
    console.error("❌ MongoDB is not connected");
    return res.status(503).json({
      error:
        "Database not available. Whiteboard persistence is currently disabled.",
    });
  }

  try {
    const { elements, appState, roomId } = req.body;

    console.log("📝 Received save request:", {
      elementsCount: elements?.length,
      hasAppState: !!appState,
      roomId,
    });

    if (!elements || !Array.isArray(elements)) {
      console.error("❌ Invalid whiteboard data - elements is not an array");
      return res.status(400).json({ error: "Invalid whiteboard data" });
    }

    // Generate unique ID
    const whiteboardId = crypto.randomBytes(8).toString("hex");

    // Create new whiteboard document
    const whiteboard = new Whiteboard({
      whiteboardId,
      roomId: roomId || null,
      elements,
      appState: appState || {},
      version: 1,
    });

    await whiteboard.save();

    console.log(`✅ Whiteboard saved: ${whiteboardId}`);

    // Use frontend URL for shareable link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    res.json({
      success: true,
      whiteboardId,
      url: `/whiteboard/${whiteboardId}`,
      shareableLink: `${frontendUrl}/whiteboard/${whiteboardId}`,
    });
  } catch (error) {
    console.error("❌ Error saving whiteboard:", error);
    res.status(500).json({ error: "Failed to save whiteboard" });
  }
}

/**
 * Load a whiteboard by ID
 */
async function loadWhiteboard(req, res) {
  // Check if MongoDB is connected
  if (!isDBConnected()) {
    return res.status(503).json({
      error:
        "Database not available. Whiteboard persistence is currently disabled.",
    });
  }

  try {
    const { id } = req.params;

    // Validate ID format (simple hex check)
    if (!/^[a-f0-9]{16}$/i.test(id)) {
      return res.status(400).json({ error: "Invalid whiteboard ID" });
    }

    // Find whiteboard in database
    const whiteboard = await Whiteboard.findOne({
      whiteboardId: id,
      isDeleted: false,
    });

    if (!whiteboard) {
      return res.status(404).json({ error: "Whiteboard not found" });
    }

    // Increment view count
    whiteboard.viewCount += 1;
    await whiteboard.save();

    res.json({
      success: true,
      whiteboard: {
        id: whiteboard.whiteboardId,
        roomId: whiteboard.roomId,
        elements: whiteboard.elements,
        appState: whiteboard.appState,
        createdAt: whiteboard.createdAt,
        version: whiteboard.version,
        viewCount: whiteboard.viewCount,
      },
    });
  } catch (error) {
    console.error("❌ Error loading whiteboard:", error);
    res.status(500).json({ error: "Failed to load whiteboard" });
  }
}

/**
 * List all saved whiteboards (optional - for admin/debugging)
 */
async function listWhiteboards(req, res) {
  // Check if MongoDB is connected
  if (!isDBConnected()) {
    return res.status(503).json({
      error: "Database not available",
    });
  }

  try {
    const { limit = 50, roomId } = req.query;

    const query = { isDeleted: false };
    if (roomId) {
      query.roomId = roomId;
    }

    const whiteboards = await Whiteboard.find(query)
      .select("whiteboardId roomId createdAt updatedAt viewCount")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: whiteboards.length,
      whiteboards: whiteboards.map((wb) => ({
        id: wb.whiteboardId,
        roomId: wb.roomId,
        createdAt: wb.createdAt,
        updatedAt: wb.updatedAt,
        viewCount: wb.viewCount,
        url: `/whiteboard/${wb.whiteboardId}`,
      })),
    });
  } catch (error) {
    console.error("❌ Error listing whiteboards:", error);
    res.status(500).json({ error: "Failed to list whiteboards" });
  }
}

/**
 * Delete a whiteboard (soft delete)
 */
async function deleteWhiteboard(req, res) {
  // Check if MongoDB is connected
  if (!isDBConnected()) {
    return res.status(503).json({
      error: "Database not available",
    });
  }

  try {
    const { id } = req.params;

    if (!/^[a-f0-9]{16}$/i.test(id)) {
      return res.status(400).json({ error: "Invalid whiteboard ID" });
    }

    const whiteboard = await Whiteboard.findOne({ whiteboardId: id });

    if (!whiteboard) {
      return res.status(404).json({ error: "Whiteboard not found" });
    }

    // Soft delete
    whiteboard.isDeleted = true;
    await whiteboard.save();

    console.log(`🗑️  Whiteboard deleted: ${id}`);
    res.json({ success: true, message: "Whiteboard deleted" });
  } catch (error) {
    console.error("❌ Error deleting whiteboard:", error);
    res.status(500).json({ error: "Failed to delete whiteboard" });
  }
}

/**
 * Update/edit an existing whiteboard
 */
async function updateWhiteboard(req, res) {
  // Check if MongoDB is connected
  if (!isDBConnected()) {
    return res.status(503).json({
      error: "Database not available",
    });
  }

  try {
    const { id } = req.params;
    const { elements, appState } = req.body;

    if (!/^[a-f0-9]{16}$/i.test(id)) {
      return res.status(400).json({ error: "Invalid whiteboard ID" });
    }

    if (!elements || !Array.isArray(elements)) {
      return res.status(400).json({ error: "Invalid whiteboard data" });
    }

    const whiteboard = await Whiteboard.findOne({
      whiteboardId: id,
      isDeleted: false,
    });

    if (!whiteboard) {
      return res.status(404).json({ error: "Whiteboard not found" });
    }

    // Update fields
    whiteboard.elements = elements;
    if (appState) {
      whiteboard.appState = appState;
    }

    await whiteboard.save();

    console.log(`✏️  Whiteboard updated: ${id}`);
    res.json({
      success: true,
      message: "Whiteboard updated",
      whiteboard: {
        id: whiteboard.whiteboardId,
        updatedAt: whiteboard.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error updating whiteboard:", error);
    res.status(500).json({ error: "Failed to update whiteboard" });
  }
}

module.exports = {
  saveWhiteboard,
  loadWhiteboard,
  listWhiteboards,
  deleteWhiteboard,
  updateWhiteboard,
};
