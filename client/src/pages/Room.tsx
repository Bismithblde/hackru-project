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
    Array<{ userId: string; username?: string; message: string; ts: number }>
  >([]);
  const meSocket = useRef<string | null>(null);
  const userIdRef = useRef<string>(uuidv4());

  const [leaderboard, setLeaderboard] = useState<
    Array<{ userId: string; username: string; points: number }>
  >([]);

  const [dailyRoomUrl, setDailyRoomUrl] = useState<string | null>(null);
  const [dailyRoomError, setDailyRoomError] = useState<string | null>(null);
  const dailyContainerRef = useRef<HTMLDivElement>(null);

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
      await joinDailyRoom(
        dailyRoomUrl,
        username,
        {
          onParticipantJoined: (participant) => {
            console.log("[Daily] Participant joined:", participant.user_name);
          },
          onParticipantLeft: (participant) => {
            console.log("[Daily] Participant left:", participant.user_name);
          },
          onError: (error) => {
            console.error("[Daily] Error:", error);
          },
        },
        dailyContainerRef.current || undefined // Pass the container for iframe
      );
      console.log("[Room] Successfully joined Daily room");
    } catch (error: any) {
      console.error("[Room] Failed to join Daily room:", error);
      alert(`Failed to join voice chat: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Study Room {roomId}
            </h2>
            <p className="text-sm text-slate-600 mt-1">Collaborate and learn together</p>
          </div>
          <Link 
            to="/rooms" 
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>←</span> Back to rooms
          </Link>
        </div>

      {!username ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Join the Study Room</h3>
            <p className="text-slate-600 mt-2">Enter your name to get started</p>
          </div>
          <label className="block">
            <input
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) setUsername(val);
                }
              }}
              placeholder="Enter your display name..."
              autoFocus
            />
          </label>
        </div>
      ) : (
        <>
          {/* User Info & Voice Controls */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{username[0].toUpperCase()}</span>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {username}
                  </div>
                  <div className="text-xs text-slate-500">
                    ID: {userIdRef.current.slice(0, 8)}...
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {dailyRoomError && (
                  <div className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                    Voice chat error: {dailyRoomError}
                  </div>
                )}
                {!dailyRoomUrl && !dailyRoomError && (
                  <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
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
            
            {/* Participants Section */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <Presence users={users} meSocketId={meSocket.current ?? ""} />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Section */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span>💬</span> Chat
              </h3>
              <Chat
                messages={messages}
                currentUserId={userIdRef.current}
                onSend={(msg: string) => {
                  if (msg.trim()) {
                    emit("chat:message", {
                      roomId: roomId,
                      userId: userIdRef.current,
                      username: username,
                      message: msg.trim(),
                      ts: Date.now(),
                    });
                  }
                }}
              />
            </div>

            {/* Leaderboard & Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>🏆</span> Leaderboard
                </h3>
                <Leaderboard entries={leaderboard} />
              </div>
              
              <div className="bg-slate-900 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                <p className="text-sm text-slate-400 mb-4">Test game features</p>
                <button
                  onClick={() => {
                    emit("game:answer", {
                      userId: userIdRef.current,
                      answer: Math.floor(Math.random() * 100).toString(),
                    });
                  }}
                  className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                >
                  Submit Random Answer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Daily.co iframe container - will appear at bottom right when voice chat is active */}
      <div ref={dailyContainerRef} id="daily-iframe-container"></div>
      </div>
    </div>
  );
};

export default Room;
