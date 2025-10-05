export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Room events
  JOIN: "join",
  LEAVE: "leave",

  // Presence
  PRESENCE_UPDATE: "presence:update",

  // Chat
  CHAT_MESSAGE: "chat:message",

  // Points
  POINTS_AWARD: "points:award",
  POINTS_UPDATE: "points:update",
  POINTS_ERROR: "points:error",

  // Game
  GAME_ANSWER: "game:answer",
} as const;

export const DAILY_CONFIG = {
  AUDIO_SOURCE: true,
  VIDEO_SOURCE: false,
  SUBSCRIBE_TRACKS_AUTOMATICALLY: true,
  IFRAME_STYLE: {
    position: "fixed" as const,
    bottom: "24px",
    right: "24px",
    width: "420px",
    height: "320px",
    border: "none",
    borderRadius: "16px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    zIndex: "9999",
  },
} as const;
