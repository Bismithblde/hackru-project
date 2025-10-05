import { useState } from "react";
import { CreateRoomModal } from "../components/CreateRoomModal";
import { JoinRoomModal } from "../components/JoinRoomModal";
import { useRoomContext } from "../contexts/RoomContext";

const Rooms = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { rooms } = useRoomContext();

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <h2 className="text-4xl font-bold text-slate-900 mb-2">Study Rooms</h2>
        <p className="text-slate-600">
          Create a new room or join an existing one with a code
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Room Card */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="group bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-lg p-8 hover:shadow-lg transition-all text-left"
        >
          <div className="text-5xl mb-4">🐰✨</div>
          <h3 className="text-2xl font-bold mb-2">Create Room</h3>
          <p className="text-indigo-100 mb-4">
            Start a new study room and invite others with a code
          </p>
          <div className="inline-flex items-center text-white font-semibold group-hover:translate-x-1 transition-transform">
            Create New Room →
          </div>
        </button>

        {/* Join Room Card */}
        <button
          onClick={() => setShowJoinModal(true)}
          className="group bg-white border-2 border-indigo-600 rounded-lg p-8 hover:shadow-lg transition-all text-left"
        >
          <div className="text-5xl mb-4">🔑</div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Join Room</h3>
          <p className="text-slate-600 mb-4">
            Enter a 6-digit code to join an existing study room
          </p>
          <div className="inline-flex items-center text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
            Enter Code →
          </div>
        </button>
      </div>

      {/* Active Rooms List */}
      {rooms.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Active Rooms
          </h3>
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.code}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-600 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{room.name}</h4>
                  <p className="text-sm text-slate-600">
                    Code: <span className="font-mono font-bold">{room.code.slice(0, 3)}-{room.code.slice(3)}</span>
                    {" • "}
                    {room.participantCount} {room.participantCount === 1 ? "participant" : "participants"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(room.code);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Copy Code
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl mb-2">1️⃣</div>
            <h4 className="font-semibold text-slate-900 mb-1">Create or Join</h4>
            <p className="text-sm text-slate-600">
              Create a new room or join with a 6-digit code
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">2️⃣</div>
            <h4 className="font-semibold text-slate-900 mb-1">Share Code</h4>
            <p className="text-sm text-slate-600">
              Share your room code with friends to invite them
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">3️⃣</div>
            <h4 className="font-semibold text-slate-900 mb-1">Study Together</h4>
            <p className="text-sm text-slate-600">
              Chat, voice call, and use the whiteboard together
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
};

export default Rooms;

