import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Room from "./pages/Room";
import bunnyLogo from "./assets/bunHead.png";
import { RoomProvider } from "./contexts/RoomContext";

const App: React.FC = () => {
  return (
    <RoomProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                >
                  <img
                    src={bunnyLogo}
                    alt="StudyBunny Logo"
                    className="w-60 h-60 object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  StudyBunny
                </h1>
              </Link>
              <nav className="flex gap-6">
                <Link
                  to="/"
                  className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/rooms"
                  className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  Rooms
                </Link>
              </nav>
            </div>
          </header>

          <main className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/room/:code" element={<Room />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </RoomProvider>
  );
};

export default App;