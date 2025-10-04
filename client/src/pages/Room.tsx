import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { connect, join, leave, on, off, emit, getSocket } from "../lib/socket";
import Presence from "../components/Presence";
import Chat from "../components/Chat";

type User = { userId: string; username: string; socketId: string };

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
    };

    const onChat = (m: any) => {
      setMessages((prev) => [...prev, m]);
    };

    on("presence:update", onPresence);
    on("chat:message", onChat);

    return () => {
      off("presence:update", onPresence);
      off("chat:message", onChat);
      leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // re-join on username selection
    if (username) {
      join(roomId, userIdRef.current, username);
    }
  }, [username, roomId]);

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
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Presence
              users={users}
              meSocketId={meSocket.current ?? undefined}
            />
          </div>

          <div className="col-span-2">
            <Chat
              messages={messages}
              onSend={(msg) => {
                emit("chat:message", {
                  roomId,
                  userId: userIdRef.current,
                  message: msg,
                  ts: Date.now(),
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
