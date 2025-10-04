import React from "react";
import { Link } from "react-router-dom";

const Rooms: React.FC = () => {
  // sample static rooms for demo
  const rooms = [
    { id: "1", name: "Mathematics Study Group", description: "Calculus, Algebra, and more", emoji: "📐" },
    { id: "2", name: "Computer Science Hub", description: "Programming and algorithms", emoji: "💻" },
    { id: "3", name: "Language Learning", description: "Practice languages together", emoji: "🌍" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <h2 className="text-4xl font-bold text-slate-900 mb-2">
          Study Rooms
        </h2>
        <p className="text-slate-600">Join a room to start collaborating with others</p>
      </div>

      {/* Rooms Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((r) => (
          <Link
            key={r.id}
            to={`/rooms/${r.id}`}
            className="group"
          >
            <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-indigo-600 hover:shadow-md transition-all h-full">
              <div className="flex flex-col h-full">
                {/* Emoji Icon */}
                <div className="text-5xl mb-4">
                  {r.emoji}
                </div>
                
                {/* Room Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {r.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    {r.description}
                  </p>
                </div>
                
                {/* Room ID Badge */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Room ID: <span className="font-mono font-medium">{r.id}</span>
                  </div>
                  <div className="text-indigo-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Join →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Custom Room Card */}
      <div className="bg-slate-900 rounded-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-2">Create Your Own Room</h3>
        <p className="text-slate-300 mb-4">
          Want a custom study room? Enter any room ID in the URL
        </p>
        <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm">
          /rooms/<span className="text-indigo-400 font-bold">your-custom-id</span>
        </div>
      </div>
    </div>
  );
};

export default Rooms;
