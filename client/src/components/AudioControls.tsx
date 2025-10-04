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
      <div className="flex items-center gap-2">
        <button
          onClick={enableMic}
          disabled={isEnabling}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {isEnabling ? "Enabling..." : "Enable Mic"}
        </button>
        <span className="text-xs text-gray-500">
          Click to enable voice chat
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        className={`px-4 py-2 rounded ${
          muted
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {muted ? "🔇 Unmute" : "🎤 Mute"}
      </button>
      <span className="text-xs text-gray-500">
        {muted ? "Mic muted" : "Mic active"}
      </span>
    </div>
  );
};

export default AudioControls;
