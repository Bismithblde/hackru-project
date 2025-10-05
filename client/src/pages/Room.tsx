import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { join, emit, getSocket } from "../lib/socket";
import { joinDailyRoom, leaveDailyRoom } from "../lib/daily";
import { useRoom, useDailyRoom } from "../hooks";
import { SOCKET_EVENTS } from "../constants";
import { useRoomContext } from "../contexts/RoomContext";
import { useToast } from "../hooks/useToast";
import { sounds } from "../utils/sounds";
import Presence from "../components/Presence";
import Chat from "../components/Chat";
import AudioControls from "../components/AudioControls";
import Leaderboard from "../components/Leaderboard";
import Whiteboard from "../components/Whiteboard";
import Quiz from "../components/Quiz";
import TimeTracker from "../components/TimeTracker";
import Toast from "../components/Toast";
import SoundToggle from "../components/SoundToggle";

const Room: React.FC = () => {
  const { code } = useParams();
  const roomId = code || "room-1";

  // Get room data from context
  const { currentRoom, fetchRooms, rooms } = useRoomContext();

  // Toast notifications
  const { toasts, removeToast, success, error, info } = useToast();

  // Play sounds with toasts
  const successWithSound = (message: string, duration?: number) => {
    sounds.success();
    success(message, duration);
  };

  const errorWithSound = (message: string, duration?: number) => {
    sounds.error();
    error(message, duration);
  };

  const infoWithSound = (message: string, duration?: number) => {
    sounds.notification();
    info(message, duration);
  };

  // Try to get username from localStorage
  const storedUsername = localStorage.getItem("studybunny_username");
  const [username, setUsername] = useState<string | null>(storedUsername);

  const [activeTab, setActiveTab] = useState<"chat" | "whiteboard">("chat");
  const userIdRef = useRef<string>(uuidv4());
  const dailyContainerRef = useRef<HTMLDivElement>(null);

  // State to hide/show the meeting UI but keep the call running
  const [meetingHidden, setMeetingHidden] = useState(false);

  // State to expand/collapse the whiteboard
  const [isWhiteboardExpanded, setIsWhiteboardExpanded] = useState(false);

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

  // Fetch room data when component mounts
  useEffect(() => {
    fetchRooms();
  }, []);

  // Find the current room by code
  const roomData = rooms.find((r) => r.code === code) || currentRoom;

  // Join socket room when username is set
  useEffect(() => {
    if (username) {
      join(roomId, userIdRef.current, username);
    }

    return () => {
      leaveDailyRoom();
    };
  }, [username, roomId]);

  // Play sound when new users join
  useEffect(() => {
    if (users.length > 1) {
      // Only play sound if not the initial load
      sounds.userJoined();
    }
  }, [users.length]);

  // Play sound when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Don't play sound for own messages
      if (lastMessage.userId !== userIdRef.current) {
        sounds.message();
      }
    }
  }, [messages.length]);

  const handleMicEnabled = async () => {
    if (!username) {
      errorWithSound("Please enter your username first");
      return;
    }

    if (!dailyRoomUrl) {
      errorWithSound("Voice room is still loading. Please wait a moment.");
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
            infoWithSound(`${participant.user_name} joined voice chat`);
          },
          onParticipantLeft: (participant) => {
            console.log("[Daily] Participant left:", participant.user_name);
            infoWithSound(`${participant.user_name} left voice chat`);
          },
          onError: (error) => {
            console.error("[Daily] Error:", error);
          },
        },
        dailyContainerRef.current || undefined
      );
      console.log("[Room] Successfully joined Daily room");
      successWithSound("Joined voice chat!");
    } catch (err: any) {
      console.error("[Room] Failed to join Daily room:", err);
      errorWithSound(`Failed to join voice chat: ${err.message || "Unknown error"}`);
    }
  };

  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      const payload = {
        roomId: roomId,
        userId: userIdRef.current,
        username: username,
        message: message.trim(),
        ts: Date.now(),
      };
      console.log("[Room] Sending message:", payload);
      emit(SOCKET_EVENTS.CHAT_MESSAGE, payload);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-slate-900">
              {roomData?.name || `Study Room ${roomId}`}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              {code && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Room Code:</span>
                  <span className="font-mono font-bold text-indigo-600 text-lg tracking-wider">
                    {code.slice(0, 3)}-{code.slice(3)}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      successWithSound("Room code copied to clipboard!");
                    }}
                    className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              )}
              <span className="text-sm text-slate-500">•</span>
              <p className="text-sm text-slate-600">
                Collaborate and learn together
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SoundToggle />
            <Link
              to="/rooms"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>←</span> Back to rooms
            </Link>
          </div>
        </div>

        <>
          {/* Username prompt overlay if not set */}
          {!username && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80">
              <div className="bg-white rounded-lg border border-slate-200 p-8 max-w-md mx-auto shadow-lg">
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
            </div>
          )}
          {/* User Info & Voice Controls */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {username ? username[0].toUpperCase() : "?"}
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
                    errorWithSound(`Microphone error: ${err}`);
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {/* Chat & Whiteboard Section with Tabs */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() =>
                    username && username.trim() && setActiveTab("chat")
                  }
                  className={`flex-1 px-6 py-4 font-semibold text-base transition-all ${
                    activeTab === "chat"
                      ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  } ${
                    !username || !username.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={!username || !username.trim()}
                  title={
                    !username || !username.trim()
                      ? "Enter your name to use chat"
                      : ""
                  }
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>💬</span> Chat
                  </span>
                </button>
                <button
                  onClick={() =>
                    username && username.trim() && setActiveTab("whiteboard")
                  }
                  className={`flex-1 px-6 py-4 font-semibold text-base transition-all ${
                    activeTab === "whiteboard"
                      ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  } ${
                    !username || !username.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={!username || !username.trim()}
                  title={
                    !username || !username.trim()
                      ? "Enter your name to use whiteboard"
                      : ""
                  }
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
                      currentUsername={username || "Anonymous"}
                      roomId={roomId}
                      onSend={handleSendMessage}
                    />
                  </div>
                ) : (
                  <div
                    className="p-6 flex items-center justify-center relative"
                    style={{ height: "100%" }}
                  >
                    {/* Expand button */}
                    {getSocket() && !isWhiteboardExpanded && (
                      <button
                        onClick={() => setIsWhiteboardExpanded(true)}
                        className="absolute top-4 left-4 z-10 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2"
                        title="Expand whiteboard"
                      >
                        <span>⛶</span> Expand
                      </button>
                    )}
                    {getSocket() && !isWhiteboardExpanded ? (
                      <Whiteboard socket={getSocket()!} roomId={roomId} />
                    ) : !getSocket() ? (
                      <div className="text-center text-slate-500">
                        <div className="text-4xl mb-4">🎨</div>
                        <p>Connecting to whiteboard...</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Whiteboard Overlay */}
            {isWhiteboardExpanded && getSocket() && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                onClick={() => setIsWhiteboardExpanded(false)}
              >
                <div
                  className="relative bg-white rounded-lg shadow-2xl"
                  style={{ width: "90vw", height: "90vh" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button */}
                  <button
                    onClick={() => setIsWhiteboardExpanded(false)}
                    className="absolute top-4 left-4 z-10 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg flex items-center gap-2"
                    title="Close expanded view"
                  >
                    <span>✕</span> Close
                  </button>
                  <div className="w-full h-full p-6">
                    <Whiteboard socket={getSocket()!} roomId={roomId} />
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard & Actions */}
            <div className="space-y-6">
              {/* Time Tracker */}
              <TimeTracker roomId={roomId} currentUserId={userIdRef.current} />

              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>🏆</span> Leaderboard
                </h3>
                <Leaderboard entries={leaderboard} />
              </div>

              <div
                id="quiz-section"
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-slate-200 p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <span>🎯</span> Study Quiz
                  {roomData?.createdBy === username && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded ml-auto">
                      Owner
                    </span>
                  )}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {roomData?.createdBy === username
                    ? "Create and manage quizzes"
                    : "Test your knowledge"}
                </p>
                <Quiz
                  roomId={roomId}
                  username={username || "Anonymous"}
                  isOwner={roomData?.createdBy === username}
                />
              </div>
            </div>
          </div>
          {/* End main content */}
        </>

        {/* Hide/Show Meeting Button */}
        <button
          onClick={() => setMeetingHidden((v) => !v)}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
        >
          {meetingHidden ? "Show Meeting" : "Hide Meeting"}
        </button>

        {/* Daily.co meeting always visible below navbar, but can be hidden */}
        <div
          ref={dailyContainerRef}
          id="daily-iframe-container"
          style={{
            position: "fixed",
            zIndex: 50,
            top: 72,
            left: 0,
            right: 0,
            margin: "0 auto",
            minWidth: 320,
            maxWidth: 600,
            minHeight: 400,
            background: "none",
            borderRadius: 0,
            boxShadow: "none",
            border: "none",
            display: meetingHidden ? "none" : "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            padding: 0,
          }}
        />
      </div>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Room;
