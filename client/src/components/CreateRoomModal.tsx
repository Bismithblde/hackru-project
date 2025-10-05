import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomContext } from "../contexts/RoomContext";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal = ({ isOpen, onClose }: CreateRoomModalProps) => {
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const { createRoom, loading, error } = useRoomContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim() || !username.trim()) {
      return;
    }

    const room = await createRoom({ 
      name: roomName.trim(),
      createdBy: username.trim()
    });
    
    if (room) {
      setCreatedCode(room.code);
      // Store username in localStorage for persistence
      localStorage.setItem("studybunny_username", username.trim());
    }
  };

  const handleJoinCreatedRoom = () => {
    if (createdCode) {
      navigate(`/room/${createdCode}`);
      handleClose();
    }
  };

  const handleClose = () => {
    setRoomName("");
    setUsername("");
    setCreatedCode(null);
    onClose();
  };

  const formatCode = (code: string): string => {
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        {!createdCode ? (
          <>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Create Study Room
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
                  htmlFor="roomName"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Room Name
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                  required
                />
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
                  disabled={loading || !roomName.trim() || !username.trim()}
                >
                  {loading ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Room Created! 🎉
            </h2>
            
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">Your Room Code:</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-indigo-600 tracking-wider">
                    {formatCode(createdCode)}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(createdCode)}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Share this code with others to invite them to your study room!
              </p>

              <button
                onClick={handleJoinCreatedRoom}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Enter Room
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
