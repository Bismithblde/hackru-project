import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomContext } from "../contexts/RoomContext";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinRoomModal = ({ isOpen, onClose }: JoinRoomModalProps) => {
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const { joinRoom, loading, error } = useRoomContext();
  const navigate = useNavigate();

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 6 characters
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const formatCodeDisplay = (code: string): string => {
    if (code.length <= 3) return code;
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6 || !username.trim()) {
      return;
    }

    const room = await joinRoom({
      code,
      username: username.trim(),
    });

    if (room) {
      // Store username in localStorage for persistence
      localStorage.setItem("studybunny_username", username.trim());
      navigate(`/room/${code}`);
      handleClose();
    }
  };

  const handleClose = () => {
    setCode("");
    setUsername("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Join Study Room
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Your Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Room Code
            </label>
            <input
              type="text"
              id="code"
              value={formatCodeDisplay(code)}
              onChange={handleCodeChange}
              placeholder="XXX-XXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-wider font-bold"
              disabled={loading}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter the 6-digit room code
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={loading || code.length !== 6 || !username.trim()}
            >
              {loading ? "Joining..." : "Join Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
