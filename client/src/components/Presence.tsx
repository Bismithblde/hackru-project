import React from "react";

type User = { userId: string; username: string; socketId: string };

import { emit } from "../lib/socket";

const Presence: React.FC<{ users: User[]; meSocketId?: string; speakingMap?: Record<string, boolean> }> = ({
  users,
  meSocketId,
  speakingMap = {},
}) => {
  return (
    <div>
      <h3 className="text-sm font-semibold">Participants</h3>
      <ul className="mt-2 space-y-2">
        {users.map((u) => (
          <li key={u.socketId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full inline-block ${speakingMap[u.socketId] ? 'bg-green-500' : 'bg-red-500'}`}
                title={speakingMap[u.socketId] ? 'Speaking' : 'Silent'}
              ></span>
              <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-medium">
                {u.username?.[0] ?? "?"}
              </div>
              <div>
                <div className="text-sm font-medium">{u.username}</div>
                <div className="text-xs text-slate-500">
                  {u.userId}
                  {meSocketId === u.socketId ? " • you" : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {meSocketId !== u.socketId && (
                <button
                  className="px-2 py-1 bg-amber-400 text-xs rounded"
                  onClick={() => {
                    const input = prompt(
                      "Award points to " + u.username + " (1-10):",
                      "1"
                    );
                    if (!input) return;
                    const pts = Number(input);
                    if (!pts || pts < 1 || pts > 10)
                      return alert("Points must be 1-10");
                    emit("points:award", {
                      roomId: (window as any).__currentRoomId || "room-1",
                      fromUserId: (window as any).__currentUserId || "unknown",
                      fromUsername:
                        (window as any).__currentUsername || "unknown",
                      toUserId: u.userId,
                      toUsername: u.username,
                      points: pts,
                      ts: Date.now(),
                    });
                  }}
                >
                  + pt
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Presence;
