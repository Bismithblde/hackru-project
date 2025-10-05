import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Room from "./pages/Room";
import Auth from "./pages/Auth";
import SavedWhiteboard from "./pages/SavedWhiteboard";
import Navbar from "./components/Navbar";
import { RoomProvider } from "./contexts/RoomContext";
import { AuthProvider } from "./contexts/AuthContext";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <RoomProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/room/:code" element={<Room />} />
                <Route path="/whiteboard/:id" element={<SavedWhiteboard />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </RoomProvider>
    </AuthProvider>
  );
};

export default App;
