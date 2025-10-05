import React, { useState, useEffect } from "react";
import { getSocket, on, off, emit } from "../lib/socket";

interface PomodoroTimerProps {
  roomId: string;
  userId: string;
  isCreator: boolean;
}

interface PomodoroState {
  isActive: boolean;
  isPaused: boolean;
  phase: "work" | "break";
  timeRemaining: number;
  cyclesCompleted: number;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  roomId,
  userId,
  isCreator,
}) => {
  const [config, setConfig] = useState({
    workDuration: 25,
    breakDuration: 5,
    enabled: false,
  });
  const [state, setState] = useState<PomodoroState>({
    isActive: false,
    isPaused: false,
    phase: "work",
    timeRemaining: 25 * 60,
    cyclesCompleted: 0,
  });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for timer state updates from server
    const handleTimerUpdate = (data: any) => {
      console.log("[Pomodoro] Timer update:", data);
      setState({
        isActive: data.isActive,
        isPaused: data.isPaused,
        phase: data.phase,
        timeRemaining: data.timeRemaining,
        cyclesCompleted: data.cyclesCompleted,
      });
    };

    const handleConfigUpdate = (data: any) => {
      console.log("[Pomodoro] Config update:", data);
      setConfig({
        workDuration: data.workDuration,
        breakDuration: data.breakDuration,
        enabled: data.enabled,
      });
      // Update time remaining if not active
      if (!state.isActive) {
        setState((prev) => ({
          ...prev,
          timeRemaining: data.workDuration * 60,
        }));
      }
    };

    const handlePhaseComplete = (data: any) => {
      console.log("[Pomodoro] Phase complete:", data);
      // State will be updated via pomodoro:tick
    };

    const handleError = (data: any) => {
      console.error("[Pomodoro] Error:", data);
      alert(data.error || "Pomodoro timer error");
    };

    // Register event listeners
    on("pomodoro:tick", handleTimerUpdate);
    on("pomodoro:config", handleConfigUpdate);
    on("pomodoro:started", handleTimerUpdate);
    on("pomodoro:paused", handleTimerUpdate);
    on("pomodoro:resumed", handleTimerUpdate);
    on("pomodoro:reset", handleTimerUpdate);
    on("pomodoro:phaseComplete", handlePhaseComplete);
    on("pomodoro:error", handleError);

    // Request initial state
    emit("pomodoro:init", { roomId });

    return () => {
      off("pomodoro:tick", handleTimerUpdate);
      off("pomodoro:config", handleConfigUpdate);
      off("pomodoro:started", handleTimerUpdate);
      off("pomodoro:paused", handleTimerUpdate);
      off("pomodoro:resumed", handleTimerUpdate);
      off("pomodoro:reset", handleTimerUpdate);
      off("pomodoro:phaseComplete", handlePhaseComplete);
      off("pomodoro:error", handleError);
    };
  }, [roomId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleEnablePomodoro = () => {
    if (!isCreator) return;
    emit("pomodoro:config", {
      roomId,
      userId,
      config: {
        ...config,
        enabled: true,
      },
    });
    setShowConfig(false);
  };

  const handleDisablePomodoro = () => {
    if (!isCreator) return;
    emit("pomodoro:config", {
      roomId,
      userId,
      config: {
        ...config,
        enabled: false,
      },
    });
  };

  const handleUpdateConfig = () => {
    if (!isCreator) return;
    emit("pomodoro:config", {
      roomId,
      userId,
      config: config,
    });
    setShowConfig(false);
  };

  const handleStart = () => {
    if (!isCreator) return;
    emit("pomodoro:start", { roomId, userId });
  };

  const handlePause = () => {
    if (!isCreator) return;
    emit("pomodoro:pause", { roomId, userId });
  };

  const handleResume = () => {
    if (!isCreator) return;
    emit("pomodoro:resume", { roomId, userId });
  };

  const handleReset = () => {
    if (!isCreator) return;
    if (confirm("Are you sure you want to reset the timer?")) {
      emit("pomodoro:reset", { roomId, userId });
    }
  };

  const handleSkip = () => {
    if (!isCreator) return;
    emit("pomodoro:skip", { roomId, userId });
  };

  if (!config.enabled) {
    if (!isCreator) return null;

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            🍅 Pomodoro Timer
          </h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
            Disabled
          </span>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          Enable the Pomodoro timer to help everyone stay focused with timed
          work sessions.
        </p>
        <button
          onClick={() => setShowConfig(true)}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Enable Pomodoro Timer
        </button>

        {showConfig && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Work Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={config.workDuration}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    workDuration: parseInt(e.target.value) || 25,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Break Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={config.breakDuration}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    breakDuration: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEnablePomodoro}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Save & Enable
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          🍅 Pomodoro Timer
        </h3>
        {isCreator && (
          <button
            onClick={handleDisablePomodoro}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Disable
          </button>
        )}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div
          className={`text-6xl font-bold mb-3 ${
            state.phase === "work" ? "text-indigo-600" : "text-green-600"
          }`}
        >
          {formatTime(state.timeRemaining)}
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              state.phase === "work"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {state.phase === "work" ? "Work Time" : "Break Time"}
          </span>
          <span className="text-sm text-slate-600">
            Cycle {state.cyclesCompleted + 1}
          </span>
        </div>
        {state.isActive && !state.isPaused && (
          <div className="text-xs text-slate-500">Timer is running...</div>
        )}
        {state.isPaused && (
          <div className="text-xs text-amber-600">⏸ Paused</div>
        )}
      </div>

      {/* Controls - Only for Room Creator */}
      {isCreator && (
        <div className="space-y-3">
          {!state.isActive && (
            <button
              onClick={handleStart}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              ▶ Start Timer
            </button>
          )}

          {state.isActive && !state.isPaused && (
            <button
              onClick={handlePause}
              className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              ⏸ Pause
            </button>
          )}

          {state.isPaused && (
            <button
              onClick={handleResume}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              ▶ Resume
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Skip Phase
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              Reset
            </button>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
          >
            ⚙️ Settings
          </button>

          {showConfig && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Work Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={config.workDuration}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      workDuration: parseInt(e.target.value) || 25,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Break Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.breakDuration}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      breakDuration: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              <button
                onClick={handleUpdateConfig}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info for non-creators */}
      {!isCreator && state.isActive && (
        <div className="text-center text-sm text-slate-600">
          Timer is controlled by the room creator
        </div>
      )}

      {!isCreator && !state.isActive && (
        <div className="text-center text-sm text-slate-600">
          Waiting for room creator to start the timer...
        </div>
      )}

      {/* Configuration display */}
      <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
        {config.workDuration}min work • {config.breakDuration}min break
      </div>
    </div>
  );
};

export default PomodoroTimer;
