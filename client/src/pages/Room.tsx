import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { join, emit, getSocket } from "../lib/socket";
import { joinDailyRoom, leaveDailyRoom } from "../lib/daily";
import { useRoom, useDailyRoom } from "../hooks";
import { SOCKET_EVENTS } from "../constants";
import Presence from "../components/Presence";
import Chat from "../components/Chat";
import AudioControls from "../components/AudioControls";
import Leaderboard from "../components/Leaderboard";
import Whiteboard from "../components/Whiteboard";

const Room: React.FC = () => {
  const { id } = useParams();
  const roomId = id || "room-1";
  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "whiteboard">("chat");
  const userIdRef = useRef<string>(uuidv4());
  const dailyContainerRef = useRef<HTMLDivElement>(null);

  // Use custom hooks for room data and daily room
  const { users, messages, leaderboard, socketId } = useRoom({
    roomId,
    userId: userIdRef.current,
    username,
  });

  const {
    dailyRoomUrl,
    error: dailyRoomError,
    loading: dailyLoading,
  } = useDailyRoom(roomId);

  // Join socket room when username is set
  useEffect(() => {
    if (username) {
      join(roomId, userIdRef.current, username);
    }

    return () => {
      leaveDailyRoom();
    };
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
        dailyContainerRef.current || undefined
      );
      console.log("[Room] Successfully joined Daily room");
    } catch (error: any) {
      console.error("[Room] Failed to join Daily room:", error);
      alert(`Failed to join voice chat: ${error.message || "Unknown error"}`);
    }
  };

  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        roomId: roomId,
        userId: userIdRef.current,
        username: username,
        message: message.trim(),
        ts: Date.now(),
      });
    }
  };

  const handleSubmitRandomAnswer = () => {
    emit(SOCKET_EVENTS.GAME_ANSWER, {
      userId: userIdRef.current,
      answer: Math.floor(Math.random() * 100).toString(),
    });
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
            <p className="text-sm text-slate-600 mt-1">
              Collaborate and learn together
            </p>
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
              <h3 className="text-2xl font-bold text-slate-900">
                Join the Study Room
              </h3>
              <p className="text-slate-600 mt-2">
                Enter your name to get started
              </p>
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
                    <span className="text-white text-xl font-bold">
                      {username[0].toUpperCase()}
                    </span>
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
                  {dailyLoading && (
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
                <Presence users={users} meSocketId={socketId ?? ""} />
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat & Whiteboard Section with Tabs */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Tab Headers */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`flex-1 px-6 py-4 font-semibold text-base transition-all ${
                      activeTab === "chat"
                        ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>💬</span> Chat
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("whiteboard")}
                    className={`flex-1 px-6 py-4 font-semibold text-base transition-all ${
                      activeTab === "whiteboard"
                        ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>🎨</span> Whiteboard
                    </span>
                  </button>
                </div>

                {/* Tab Content */}
                <div style={{ height: "600px", width: "100%" }}>
                  {activeTab === "chat" ? (
                    <div className="h-full p-6">
                      <Chat
                        messages={messages}
                        currentUserId={userIdRef.current}
                        onSend={handleSendMessage}
                      />
                    </div>
                  ) : (
                    <div className="p-6 flex items-center justify-center" style={{ height: "100%" }}>
                      <Whiteboard socket={getSocket()!} roomId={roomId} />
                    </div>
                  )}
                </div>
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
                  <p className="text-sm text-slate-400 mb-4">
                    Test game features
                  </p>
                  <button
                    onClick={handleSubmitRandomAnswer}
                    className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                  >
                    Submit Random Answer
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Daily.co iframe container */}
        <div ref={dailyContainerRef} id="daily-iframe-container"></div>
      </div>
    </div>
  );
};

export default Room;
