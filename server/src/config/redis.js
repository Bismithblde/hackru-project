const Redis = require("ioredis");

let redis = null;
let isAvailable = false;

/**
 * Initialize Redis connection
 */
function initRedis() {
  try {
    // Check if Redis configuration is provided
    const REDIS_URL = process.env.REDIS_URL;
    const REDIS_HOST = process.env.REDIS_HOST || "localhost";
    const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
    const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
    const REDIS_DB = parseInt(process.env.REDIS_DB || "0", 10);

    console.log("🔄 Redis: Attempting to connect...");

    // Create Redis client
    if (REDIS_URL) {
      // Use full connection URL (for Render, Heroku, etc.)
      console.log(`🔗 Redis: Using connection URL`);
      redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn("⚠️  Redis: Max retries reached, giving up");
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });
    } else {
      // Use individual host/port/password (for local development)
      console.log(`🔗 Redis: Using host:port (${REDIS_HOST}:${REDIS_PORT})`);
      redis = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        db: REDIS_DB,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn("⚠️  Redis: Max retries reached, giving up");
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });
    }

    // Handle connection events
    redis.on("connect", () => {
      console.log("✅ Redis: Connected successfully");
      isAvailable = true;
    });

    redis.on("ready", () => {
      console.log("✅ Redis: Ready to accept commands");
      isAvailable = true;
    });

    redis.on("error", (err) => {
      console.error("❌ Redis: Connection error:", err.message);
      isAvailable = false;
    });

    redis.on("close", () => {
      console.warn("⚠️  Redis: Connection closed");
      isAvailable = false;
    });

    redis.on("reconnecting", () => {
      console.log("🔄 Redis: Reconnecting...");
    });

    // Test connection
    redis
      .ping()
      .then(() => {
        console.log("✅ Redis: PING successful");
        isAvailable = true;
      })
      .catch((err) => {
        console.error("❌ Redis: PING failed:", err.message);
        console.warn("⚠️  Redis: Chat history and room persistence will be disabled");
        isAvailable = false;
      });
  } catch (error) {
    console.error("❌ Redis: Failed to initialize:", error.message);
    console.warn("⚠️  Redis: Chat history and room persistence will be disabled");
    isAvailable = false;
  }
}

/**
 * Check if Redis is available
 */
function isRedisAvailable() {
  return isAvailable && redis !== null;
}

/**
 * Close Redis connection gracefully
 */
async function closeRedis() {
  if (redis) {
    try {
      await redis.quit();
      console.log("✅ Redis: Connection closed gracefully");
    } catch (error) {
      console.error("❌ Redis: Error closing connection:", error);
    }
  }
}

// Initialize on module load
initRedis();

module.exports = {
  redis,
  isRedisAvailable,
  closeRedis,
};
