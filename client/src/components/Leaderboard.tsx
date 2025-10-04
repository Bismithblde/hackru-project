import React from "react";

type Entry = { userId: string; username: string; points: number };

const Leaderboard: React.FC<{ entries: Entry[] }> = ({ entries }) => {
  return (
    <div className="p-3 bg-white border rounded">
      <h4 className="text-sm font-semibold mb-2">Leaderboard</h4>
      <ol className="list-decimal list-inside text-sm space-y-1">
        {entries.length === 0 ? (
          <li className="text-xs text-slate-500">No scores yet</li>
        ) : (
          entries.map((e) => (
            <li key={e.userId} className="flex justify-between">
              <span>{e.username}</span>
              <span className="font-mono">{e.points}</span>
            </li>
          ))
        )}
      </ol>
    </div>
  );
};

export default Leaderboard;
