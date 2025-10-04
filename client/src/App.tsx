import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Room from "./pages/Room";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-800">HackRU</h1>
            <nav className="flex gap-4">
              <Link to="/" className="text-slate-600 hover:text-slate-900">
                Home
              </Link>
              <Link to="/rooms" className="text-slate-600 hover:text-slate-900">
                Rooms
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:id" element={<Room />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
