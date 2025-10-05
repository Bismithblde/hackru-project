import { useState, useEffect } from "react";
import { connect, leave, on, off, getSocket } from "../lib/socket";
import { SOCKET_EVENTS } from "../constants";
import type { User, LeaderboardEntry, Message } from "../types";

interface UseRoomOptions {
  roomId: string;
  userId: string;
  username: string | null;
}

export function useRoom({ roomId, userId, username }: UseRoomOptions) {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    // Connect to socket
    connect();
    const socket = getSocket();
    if (socket) {
      setSocketId(socket.id ?? null);
    }

    // Store room/user info in window for backward compatibility
    (window as any).__currentRoomId = roomId;
    (window as any).__currentUserId = userId;
    (window as any).__currentUsername = username;

    // Set up event handlers
    const handlePresenceUpdate = (updatedUsers: User[]) => {
      setUsers(updatedUsers);
      const s = getSocket();
      if (s) setSocketId(s.id ?? null);
    };

    const handlePointsUpdate = (payload: any) => {
      const { leaderboard: updatedLeaderboard } = payload || {};
      if (updatedLeaderboard) {
        setLeaderboard(updatedLeaderboard);
      }
    };

    const handleChatMessage = (message: Message) => {
      console.log("[useRoom] Received chat message:", message);
      setMessages((prev) => [...prev, message]);
    };

    const handleChatHistory = (payload: { messages: Message[] }) => {
      console.log("[useRoom] Received chat history:", payload.messages?.length || 0, "messages");
      if (payload.messages && Array.isArray(payload.messages)) {
        setMessages(payload.messages);
      }
    };

    // Register event listeners
    on(SOCKET_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
    on(SOCKET_EVENTS.POINTS_UPDATE, handlePointsUpdate);
    on(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
    on("chat:history", handleChatHistory); // Listen for chat history when joining

    // Cleanup
    return () => {
      off(SOCKET_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
      off(SOCKET_EVENTS.POINTS_UPDATE, handlePointsUpdate);
      off(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
      off("chat:history", handleChatHistory);
      leave();
    };
  }, [username, roomId, userId]);

  return {
    users,
    messages,
    leaderboard,
    socketId,
  };
}
