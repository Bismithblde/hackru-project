const https = require("https");

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_BASE = "https://api.daily.co/v1";

/**
 * Make an HTTPS request
 */
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: async () => JSON.parse(data),
          text: async () => data,
        });
      });
    });
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Create a Daily.co room for a given room ID
 * @param {string} roomId - The unique room identifier
 * @returns {Promise<{url: string, name: string}>} Room URL and name
 */
async function createDailyRoom(roomId) {
  if (!DAILY_API_KEY) {
    console.error("[Daily] DAILY_API_KEY is not set!");
    throw new Error("DAILY_API_KEY is not set in environment variables");
  }

  console.log("[Daily] Creating room:", roomId);

  try {
    const body = JSON.stringify({
      name: roomId,
      privacy: "public",
      properties: {
        enable_chat: false,
        enable_screenshare: false,
        start_video_off: true,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours from now
      },
    });

    const response = await makeRequest(`${DAILY_API_BASE}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DAILY_API_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Daily] API error response:", response.status, errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Daily API error: ${response.status} ${response.statusText}`);
      }
      
      // If room already exists, try to get it
      if (error.info === "room-name-already-exists") {
        console.log("[Daily] Room already exists, fetching existing room");
        return await getDailyRoom(roomId);
      }
      throw new Error(`Daily API error: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    console.log("[Daily] Created room successfully:", data.name);
    return {
      url: data.url,
      name: data.name,
    };
  } catch (error) {
    console.error("[Daily] Failed to create room:", error);
    throw error;
  }
}

/**
 * Get an existing Daily.co room
 * @param {string} roomId - The unique room identifier
 * @returns {Promise<{url: string, name: string}>} Room URL and name
 */
async function getDailyRoom(roomId) {
  if (!DAILY_API_KEY) {
    throw new Error("DAILY_API_KEY is not set in environment variables");
  }

  try {
    const response = await makeRequest(`${DAILY_API_BASE}/rooms/${roomId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Daily API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.url,
      name: data.name,
    };
  } catch (error) {
    console.error("[Daily] Failed to get room:", error);
    throw error;
  }
}

/**
 * Delete a Daily.co room
 * @param {string} roomId - The unique room identifier
 */
async function deleteDailyRoom(roomId) {
  if (!DAILY_API_KEY) {
    throw new Error("DAILY_API_KEY is not set in environment variables");
  }

  try {
    const response = await makeRequest(`${DAILY_API_BASE}/rooms/${roomId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Daily API error: ${response.statusText}`);
    }

    console.log("[Daily] Deleted room:", roomId);
  } catch (error) {
    console.error("[Daily] Failed to delete room:", error);
    // Don't throw - room deletion is not critical
  }
}

module.exports = {
  createDailyRoom,
  getDailyRoom,
  deleteDailyRoom,
};
