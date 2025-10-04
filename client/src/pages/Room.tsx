import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { connect, join, leave, on, off, emit, getSocket } from "../lib/socket";
import Presence from "../components/Presence";
import Chat from "../components/Chat";
import AudioControls from "../components/AudioControls";
import Leaderboard from "../components/Leaderboard";
import { joinDailyRoom, leaveDailyRoom } from "../lib/daily";

type User = { userId: string; username: string; socketId: string };

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const Room: React.FC = () => {
  const { id } = useParams();
  const roomId = id || "room-1";
  const [username, setUsername] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<
    Array<{ userId: string; message: string; ts: number }>
  >([]);
  const meSocket = useRef<string | null>(null);
  const userIdRef = useRef<string>(uuidv4());

  const [leaderboard, setLeaderboard] = useState<
    Array<{ userId: string; username: string; points: number }>
  >([]);

  const [dailyRoomUrl, setDailyRoomUrl] = useState<string | null>(null);
  const [dailyRoomError, setDailyRoomError] = useState<string | null>(null);

  // Fetch Daily room URL when component mounts
  useEffect(() => {
    const fetchDailyRoom = async () => {
      try {
        console.log(
          "[Daily] Fetching room URL from:",
          `${SERVER_URL}/api/daily-room/${roomId}`
        );
        const response = await fetch(`${SERVER_URL}/api/daily-room/${roomId}`);

        if (!response.ok) {
          throw new Error(
            `Server returned ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.url) {
          throw new Error("No room URL returned from server");
        }

        setDailyRoomUrl(data.url);
        console.log("[Daily] Room URL fetched successfully:", data.url);
      } catch (error: any) {
        console.error("[Daily] Failed to fetch room URL:", error);
        setDailyRoomError(error.message || "Failed to create voice room");
      }
    };
    fetchDailyRoom();
  }, [roomId]);

  useEffect(() => {
    connect();
    const socket = getSocket();
    if (socket) {
      meSocket.current = socket.id ?? null;
    }

    const onPresence = (u: User[]) => {
      setUsers(u);
      const s = getSocket();
      if (s) meSocket.current = s.id ?? null;
      console.log("[Room] Presence update. My socket:", s?.id, "Users:", u);
    };

    const onPointsUpdate = (payload: any) => {
      const { leaderboard } = payload || {};
      if (!leaderboard) return;
      setLeaderboard(leaderboard);
    };

    const onChat = (m: any) => {
      setMessages((prev) => [...prev, m]);
    };

    on("presence:update", onPresence);
    on("points:update", onPointsUpdate);
    on("chat:message", onChat);

    return () => {
      off("presence:update", onPresence);
      off("points:update", onPointsUpdate);
      off("chat:message", onChat);
      leaveDailyRoom();
      leave();
    };
  }, []);

  useEffect(() => {
    if (username) {
      (window as any).__currentRoomId = roomId;
      (window as any).__currentUserId = userIdRef.current;
      (window as any).__currentUsername = username;
      join(roomId, userIdRef.current, username);
    }
  }, [username, roomId]);

  const handleMicEnabled = async () => {
    if (!username) {
      alert("Please enter your username first");
      return;
    }

    if (!dailyRoomUrl) {
      alert("Voice room is still loading. Please wait a moment and try again.");
      console.error("[Daily] Room URL not available yet");
      return;
    }

    try {
      console.log("[Daily] Joining room:", dailyRoomUrl, "as", username);
      await joinDailyRoom(dailyRoomUrl, username, {
        onParticipantJoined: (participant) => {
          console.log("[Daily] Participant joined:", participant.user_name);
        },
        onParticipantLeft: (participant) => {
          console.log("[Daily] Participant left:", participant.user_name);
        },
        onError: (error) => {
          console.error("[Daily] Error:", error);
        },
      });
      console.log("[Room] Successfully joined Daily room");
    } catch (error: any) {
      console.error("[Room] Failed to join Daily room:", error);
      alert(`Failed to join voice chat: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Room {roomId}</h2>
        <Link to="/rooms" className="text-sm text-indigo-600 hover:underline">
          Back to rooms
        </Link>
      </div>

      {!username ? (
        <div className="p-6 bg-white border rounded-md">
          <label className="block">
            <div className="text-sm font-medium mb-2">Enter display name</div>
            <input
              className="px-3 py-2 border rounded w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) setUsername(val);
                }
              }}
              placeholder="Enter your display name and press Enter"
            />
          </label>
        </div>
      ) : (
        <>
          <div className="p-4 bg-white border rounded-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium">
                  Logged in as: <strong>{username}</strong>
                </div>
                <div className="text-xs text-gray-500">
                  User ID: {userIdRef.current.slice(0, 8)}...
                </div>
              </div>
              <div>
                {dailyRoomError && (
                  <div className="text-xs text-red-600 mb-2">
                    Voice chat error: {dailyRoomError}
                  </div>
                )}
                {!dailyRoomUrl && !dailyRoomError && (
                  <div className="text-xs text-gray-500 mb-2">
                    Loading voice chat...
                  </div>
                )}
                <AudioControls
                  onMicEnabled={handleMicEnabled}
                  onError={(err) => {
                    console.error("[Room] Mic error:", err);
                    alert(`Microphone error: ${err}`);
                  }}
                />
              </div>
            </div>
            <Presence users={users} meSocketId={meSocket.current ?? ""} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Chat
                messages={messages}
                onSend={(msg: string) => {
                  if (msg.trim()) {
                    emit("chat:message", {
                      userId: userIdRef.current,
                      message: msg.trim(),
                      ts: Date.now(),
                    });
                  }
                }}
              />
            </div>
            <div>
              <Leaderboard entries={leaderboard} />
              <button
                onClick={() => {
                  emit("game:answer", {
                    userId: userIdRef.current,
                    answer: Math.floor(Math.random() * 100).toString(),
                  });
                }}
                className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Submit Random Answer (test)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Room;
