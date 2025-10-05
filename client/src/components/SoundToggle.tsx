import React, { useState } from "react";
import { sounds } from "../utils/sounds";

const SoundToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(sounds.isEnabled());

  const handleToggle = () => {
    const newState = sounds.toggle();
    setEnabled(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
      title={enabled ? "Sound effects enabled" : "Sound effects disabled"}
    >
      <span className="text-lg">{enabled ? "🔊" : "🔇"}</span>
      <span className="text-slate-700">{enabled ? "Sound On" : "Sound Off"}</span>
    </button>
  );
};

export default SoundToggle;
