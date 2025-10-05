import React from "react";
import type { User } from "../types";
import { emit } from "../lib/socket";
import { SOCKET_EVENTS } from "../constants";

interface PresenceProps {
  users: User[];
  meSocketId?: string;
}

const Presence: React.FC<PresenceProps> = ({ users, meSocketId }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="text-lg">👥</span>
          Participants
          <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 rounded-md">
            {users.length}
          </span>
        </h3>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <div className="text-3xl mb-2">👻</div>
          <p className="text-sm">No one else here yet...</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => (
            <li
              key={u.socketId}
              className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200 hover:bg-slate-100 transition-colors animate-fadeIn"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  {u.username?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    {u.username}
                    {meSocketId === u.socketId && (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-green-200">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {u.userId.slice(0, 8)}...
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {meSocketId !== u.socketId && (
                  <button
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg font-medium transition-colors"
                    onClick={() => {
                      const input = prompt(
                        "Award points to " + u.username + " (1-10):",
                        "1"
                      );
                      if (!input) return;
                      const pts = Number(input);
                      if (!pts || pts < 1 || pts > 10)
                        return alert("Points must be 1-10");
                      emit(SOCKET_EVENTS.POINTS_AWARD, {
                        roomId: (window as any).__currentRoomId || "room-1",
                        fromUserId:
                          (window as any).__currentUserId || "unknown",
                        fromUsername:
                          (window as any).__currentUsername || "unknown",
                        toUserId: u.userId,
                        toUsername: u.username,
                        points: pts,
                        ts: Date.now(),
                      });
                    }}
                  >
                    +✨ Points
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Presence;
