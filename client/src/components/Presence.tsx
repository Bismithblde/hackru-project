import React from "react";

type User = { userId: string; username: string; socketId: string };

const Presence: React.FC<{ users: User[]; meSocketId?: string }> = ({
  users,
  meSocketId,
}) => {
  return (
    <div>
      <h3 className="text-sm font-semibold">Participants</h3>
      <ul className="mt-2 space-y-2">
        {users.map((u) => (
          <li key={u.socketId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Presence;
