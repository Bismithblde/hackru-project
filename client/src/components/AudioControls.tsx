import React, { useState } from "react";
import { setMicEnabled } from "../lib/daily";

interface AudioControlsProps {
  onMicEnabled?: () => void;
  onError?: (error: string) => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  onMicEnabled,
  onError,
}) => {
  const [hasMic, setHasMic] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  const enableMic = async () => {
    setIsEnabling(true);
    try {
      await setMicEnabled(true);
      setHasMic(true);
      setMuted(false);
      onMicEnabled?.();
      console.log("[AudioControls] Mic enabled successfully");
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to enable microphone";
      console.error("[AudioControls] Enable mic failed:", error);
      onError?.(errorMsg);
    } finally {
      setIsEnabling(false);
    }
  };

  const toggleMute = async () => {
    const newMutedState = !muted;
    setMuted(newMutedState);
    await setMicEnabled(!newMutedState);
    console.log("[AudioControls]", newMutedState ? "Muted" : "Unmuted");
  };

  if (!hasMic) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={enableMic}
          disabled={isEnabling}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition-colors font-medium flex items-center gap-2"
        >
          <span>🎤</span>
          {isEnabling ? "Connecting..." : "Enable Voice Chat"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleMute}
        className={`px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center gap-2 ${
          muted
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        <span>{muted ? "🔇" : "🎤"}</span>
        {muted ? "Unmute" : "Mute"}
      </button>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
        muted ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
      }`}>
        <div className={`w-2 h-2 rounded-full ${muted ? "bg-red-500" : "bg-green-500 animate-pulse"}`}></div>
        <span className="text-xs font-medium">
          {muted ? "Muted" : "Active"}
        </span>
      </div>
    </div>
  );
};

export default AudioControls;
