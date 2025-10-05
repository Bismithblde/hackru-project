import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../constants/config";

interface TimeStats {
  userId: string;
  username: string;
  totalTime: number;
  sessionCount: number;
  isCurrentlyActive: boolean;
  lastSeen: Date;
}

interface TimeTrackerProps {
  roomId: string;
  currentUserId?: string;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ roomId, currentUserId }) => {
  const [stats, setStats] = useState<TimeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchTimeStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchTimeStats, 30000);
    return () => clearInterval(interval);
  }, [roomId]);

  const fetchTimeStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/time-tracking/room/${roomId}`
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.users);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch time stats");
      }
    } catch (err: any) {
      console.error("[TimeTracker] Error fetching stats:", err);
      setError("Failed to load time tracking data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <p className="text-red-700 text-sm">⚠️ {error}</p>
      </div>
    );
  }

  const totalUserCount = stats.length;
  const activeUserCount = stats.filter((s) => s.isCurrentlyActive).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⏱️</span>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">Time Tracking</h3>
            <p className="text-xs text-gray-500">
              {activeUserCount} active · {totalUserCount} total users
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded Stats List */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {stats.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">No time data yet</p>
              <p className="text-xs mt-1">
                Stats will appear as users spend time in this room
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.map((stat, index) => (
                <div
                  key={stat.userId}
                  className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                    stat.userId === currentUserId ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-6 text-center">
                        {index < 3 ? (
                          <span className="text-lg">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-gray-400">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* Username */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 truncate">
                            {stat.username}
                            {stat.userId === currentUserId && (
                              <span className="text-xs text-blue-600 ml-1">
                                (You)
                              </span>
                            )}
                          </p>
                          {stat.isCurrentlyActive && (
                            <span className="flex-shrink-0 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {stat.sessionCount} session
                          {stat.sessionCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-semibold text-gray-800">
                        {formatTime(stat.totalTime)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
