import React from "react";
import { Link } from "react-router-dom";

const Rooms: React.FC = () => {
  // sample static rooms for demo
  const rooms = [
    { id: "1", name: "Blue Room" },
    { id: "2", name: "Green Room" },
    { id: "3", name: "Red Room" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">Rooms</h2>
      <p className="text-slate-600 mt-1">Select a room to view details.</p>

      <ul className="mt-4 space-y-3">
        {rooms.map((r) => (
          <li
            key={r.id}
            className="bg-white border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-medium text-slate-800">{r.name}</div>
              <div className="text-xs text-slate-500">id: {r.id}</div>
            </div>
            <Link
              to={`/rooms/${r.id}`}
              className="text-indigo-600 hover:underline"
            >
              Open
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Rooms;
