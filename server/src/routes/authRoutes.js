const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * POST /api/auth/register - Register new user
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        error: "Username must be 3-20 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Username already taken",
      });
    }

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      password,
      displayName: displayName || username,
    });

    await user.save();

    console.log(`[Auth] ✅ User registered: ${username}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to register user",
    });
  }
});

/**
 * POST /api/auth/login - Login user
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    // Update last login
    user.lastLoginAt = Date.now();
    await user.save();

    console.log(`[Auth] ✅ User logged in: ${username}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to login",
    });
  }
});

/**
 * GET /api/auth/check/:username - Check if username is available
 */
router.get("/check/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const exists = await User.findOne({
      username: username.toLowerCase(),
    });

    res.json({
      success: true,
      available: !exists,
    });
  } catch (error) {
    console.error("[Auth] Username check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check username",
    });
  }
});

module.exports = router;
