import React, { useState } from "react";
import { initLocalAudio } from "../lib/webrtc";

const AudioControls: React.FC<{ onReady?: () => void }> = ({ onReady }) => {
  const [muted, setMuted] = useState(true);
  const [hasMic, setHasMic] = useState(false);

  const enable = async () => {
    try {
      const stream = await initLocalAudio();
      if (stream) {
        setHasMic(true);
        setMuted(false);
        onReady && onReady();
      }
    } catch (e) {
      console.error("microphone denied", e);
    }
  };

  const toggleMute = async () => {
    try {
      const stream = await initLocalAudio();
      if (stream) {
        for (const t of stream.getTracks()) t.enabled = muted;
        setMuted(!muted);
      }
    } catch (e) {
      console.error("toggle mute failed", e);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!hasMic ? (
        <button
          onClick={enable}
          className="px-3 py-2 bg-indigo-600 text-white rounded"
        >
          Enable Mic
        </button>
      ) : (
        <button
          onClick={toggleMute}
          className="px-3 py-2 bg-indigo-600 text-white rounded"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      )}
    </div>
  );
};

export default AudioControls;
