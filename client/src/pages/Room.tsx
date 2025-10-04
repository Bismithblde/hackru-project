import React from "react";
import { useParams, Link } from "react-router-dom";

const Room: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Room {id}</h2>
        <Link to="/rooms" className="text-sm text-indigo-600 hover:underline">
          Back to rooms
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-slate-600">This is a stub page for room id <span className="font-mono text-sm text-slate-800">{id}</span>.</p>
      </div>
    </div>
  );
};

export default Room;