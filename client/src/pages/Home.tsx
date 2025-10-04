import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Welcome</h2>
      <p className="text-slate-600">
        This is the Home page. Use the Rooms page to view available rooms.
      </p>

      <div className="mt-4">
        <Link
          to="/rooms"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          View Rooms
        </Link>
      </div>
    </div>
  );
};

export default Home;
