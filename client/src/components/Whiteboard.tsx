import React, { useState, useEffect, useCallback } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Socket } from "socket.io-client";

interface WhiteboardProps {
  socket: Socket | null;
  roomId: string;
}

// Error Boundary for Excalidraw
class ExcalidrawErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Excalidraw error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <div className="text-center p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Whiteboard Loading Error
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              The whiteboard failed to load. Try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Whiteboard: React.FC<WhiteboardProps> = ({ socket, roomId }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Handle incoming whiteboard updates from other users
  useEffect(() => {
    if (!socket || !excalidrawAPI) return;

    const handleWhiteboardUpdate = (data: { elements: any[] }) => {
      try {
        excalidrawAPI.updateScene({
          elements: data.elements,
        });
      } catch (error) {
        console.error("Error updating whiteboard:", error);
      }
    };

    socket.on("whiteboard-update", handleWhiteboardUpdate);

    return () => {
      socket.off("whiteboard-update", handleWhiteboardUpdate);
    };
  }, [socket, excalidrawAPI]);

  // Send whiteboard changes to other users with throttling for real-time updates
  const handleChange = useCallback(
    (elements: readonly any[]) => {
      if (socket && isCollaborating) {
        socket.emit("whiteboard-change", {
          roomId,
          elements: elements,
        });
      }
    },
    [socket, roomId, isCollaborating]
  );

  // Save whiteboard to backend
  const handleSaveWhiteboard = async () => {
    if (!excalidrawAPI) return;

    try {
      setSaveStatus('saving');
      
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();

      const response = await fetch('http://localhost:4000/api/whiteboards/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elements,
          appState,
          roomId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveStatus('saved');
        
        // Copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.shareableLink);
          alert(`Whiteboard saved! Link copied to clipboard:\n${data.shareableLink}`);
        } else {
          alert(`Whiteboard saved! Share this link:\n${data.shareableLink}`);
        }
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving whiteboard:', error);
      setSaveStatus('error');
      alert('Failed to save whiteboard. Please try again.');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  return (
    <ExcalidrawErrorBoundary>
      <div
        className="flex flex-col gap-3 w-full"
        style={{ height: "550px", maxHeight: "550px" }}
      >
        {/* Collaboration Toggle - Above Canvas */}
        <div className="flex justify-between items-center px-2">
          <button
            onClick={handleSaveWhiteboard}
            disabled={saveStatus === 'saving' || !excalidrawAPI}
            className={`px-4 py-2 rounded-lg font-medium text-sm shadow transition-all ${
              saveStatus === 'saved'
                ? 'bg-green-500 text-white'
                : saveStatus === 'saving'
                ? 'bg-slate-400 text-white cursor-wait'
                : saveStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {saveStatus === 'saving' && '⏳ Saving...'}
            {saveStatus === 'saved' && '✓ Saved!'}
            {saveStatus === 'error' && '✗ Error'}
            {saveStatus === 'idle' && '💾 Save Whiteboard'}
          </button>
          
          <button
            onClick={() => setIsCollaborating(!isCollaborating)}
            className={`px-4 py-2 rounded-lg font-medium text-sm shadow transition-all ${
              isCollaborating
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            {isCollaborating ? "🟢 Live Sync ON" : "⚪ Live Sync OFF"}
          </button>
        </div>

        {/* Excalidraw Canvas - Fixed dimensions to prevent overflow */}
        <div
          className="bg-white rounded-lg border border-slate-200"
          style={{
            height: "500px",
            width: "100%",
            maxWidth: "1400px",
            maxHeight: "500px",
            minHeight: "500px",
            minWidth: "300px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            onChange={(elements) => handleChange(elements)}
            onPointerUpdate={(payload) => {
              // Send real-time pointer updates for cursor tracking
              if (socket && isCollaborating && payload.button === "down") {
                socket.emit("whiteboard-pointer", {
                  roomId,
                  x: payload.pointer.x,
                  y: payload.pointer.y,
                });
              }
            }}
            isCollaborating={isCollaborating}
            initialData={{
              appState: {
                viewBackgroundColor: "#ffffff",
                currentItemFontFamily: 1,
              },
              scrollToContent: false,
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
            <WelcomeScreen>
              <WelcomeScreen.Hints.MenuHint />
              <WelcomeScreen.Hints.ToolbarHint />
            </WelcomeScreen>
          </Excalidraw>
        </div>
      </div>
    </ExcalidrawErrorBoundary>
  );
};

export default Whiteboard;
