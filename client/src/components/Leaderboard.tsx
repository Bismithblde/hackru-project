import React from "react";
import type { LeaderboardEntry } from "../types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries }) => {
  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  return (
    <div>
      {entries.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm">No scores yet</p>
          <p className="text-xs mt-1">Be the first to earn points!</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {entries.map((e, index) => (
            <li
              key={e.userId}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                index < 3
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold w-8">
                  {getMedalEmoji(index)}
                </span>
                <span className="font-semibold text-slate-900">
                  {e.username}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-indigo-600">
                  {e.points}
                </span>
                <span className="text-xs text-slate-500">pts</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard;
