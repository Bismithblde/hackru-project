import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { SERVER_URL } from "../constants/config";

const SavedWhiteboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whiteboardData, setWhiteboardData] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      setError("No whiteboard ID provided");
      setLoading(false);
      return;
    }

    loadWhiteboard();
  }, [id]);

  const loadWhiteboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${SERVER_URL}/api/whiteboards/${id}`);
      const data = await response.json();

      if (data.success) {
        setWhiteboardData(data.whiteboard);
      } else {
        setError(data.error || "Failed to load whiteboard");
      }
    } catch (err) {
      console.error("Error loading whiteboard:", err);
      setError("Failed to load whiteboard. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Whiteboard...</h2>
          <p className="text-slate-600">Please wait while we fetch your saved drawing.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Whiteboard Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              📋 Saved Whiteboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Created: {new Date(whiteboardData.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Whiteboard Display */}
      <div className="max-w-7xl mx-auto p-4">
        <div
          className="bg-white rounded-lg border border-slate-200 shadow-lg"
          style={{ height: "calc(100vh - 180px)", minHeight: "600px" }}
        >
          {whiteboardData && (
            <Excalidraw
              initialData={{
                elements: whiteboardData.elements,
                appState: {
                  ...whiteboardData.appState,
                  viewBackgroundColor: "#ffffff",
                },
                scrollToContent: true,
              }}
              theme="light"
              viewModeEnabled={false}
              zenModeEnabled={false}
              gridModeEnabled={false}
            >
              <MainMenu>
                <MainMenu.DefaultItems.ClearCanvas />
                <MainMenu.DefaultItems.SaveAsImage />
                <MainMenu.DefaultItems.ChangeCanvasBackground />
              </MainMenu>
            </Excalidraw>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">View-Only Mode</h3>
              <p className="text-sm text-blue-800">
                This is a saved snapshot of the whiteboard. You can view and export it, but changes won't be saved.
                To collaborate in real-time, join a study room!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedWhiteboard;
