import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { connect, join, leave, on, off, emit, getSocket } from "../lib/socket";
import Presence from "../components/Presence";
import Chat from "../components/Chat";
import AudioControls from "../components/AudioControls";
import Leaderboard from "../components/Leaderboard";
import {
  createOffer,
  handleOffer,
  handleAnswer,
  setRemoteTrackCallback,
  handleIceCandidate,
  cleanup,
} from "../lib/webrtc";

type User = { userId: string; username: string; socketId: string };

const Room: React.FC = () => {
  const { id } = useParams();
  const roomId = id || "room-1";
  const [username, setUsername] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<
    Array<{ userId: string; message: string; ts: number }>
  >([]);
  const meSocket = useRef<string | null>(null);
  const userIdRef = useRef<string>(uuidv4());

  const [leaderboard, setLeaderboard] = useState<
    Array<{ userId: string; username: string; points: number }>
  >([]);

  // speakingMap: socketId -> boolean (true if remote user is speaking)
  // Track which peers we've already offered to (persists across renders)
  const offeredPeers = useRef<Set<string>>(new Set());

  // Centralized mic state
  const [hasMic, setHasMic] = useState(false);

  useEffect(() => {
    connect();
    const socket = getSocket();
    if (socket) {
      meSocket.current = socket.id ?? null;
    }

    const onPresence = (u: User[]) => {
      setUsers(u);
      const s = getSocket();
      if (s) meSocket.current = s.id ?? null;

      // eslint-disable-next-line no-console
      console.log("[Room] Presence update. My socket:", s?.id, "Users:", u);

      // Only signal peers if mic is enabled
      if (!hasMic) {
        // eslint-disable-next-line no-console
        console.warn("Mic not enabled, cannot signal peers");
        return;
      }
      for (const usr of u) {
        if (
          usr.socketId &&
          usr.socketId !== meSocket.current &&
          !offeredPeers.current.has(usr.socketId)
        ) {
          // eslint-disable-next-line no-console
          console.log(
            "[Room] Creating offer to new peer:",
            usr.socketId,
            usr.username
          );
          offeredPeers.current.add(usr.socketId);
          window.dispatchEvent(
            new CustomEvent("webrtc-create-offer", {
              detail: { to: usr.socketId },
            })
          );
        }
      }
    };

    const onPointsUpdate = (payload: any) => {
      const { leaderboard } = payload || {};
      if (!leaderboard) return;
      setLeaderboard(leaderboard);
    };

    const onChat = (m: any) => {
      setMessages((prev) => [...prev, m]);
    };

    const onOffer = async (payload: any) => {
      const { from, sdp } = payload || {};
      if (!from || !sdp) return;
      // eslint-disable-next-line no-console
      console.log("[Room] Received offer from:", from);
      // Reset offer state for this peer (allow renegotiation)
      offeredPeers.current.delete(from);
      const answer = await handleOffer(from, sdp);
      // eslint-disable-next-line no-console
      console.log("[Room] Sending answer to:", from);
      emit("webrtc:answer", { to: from, sdp: answer });
    };

    const onAnswer = async (payload: any) => {
      const { from, sdp } = payload || {};
      if (!from || !sdp) return;
      // eslint-disable-next-line no-console
      console.log("[Room] Received answer from:", from);
      await handleAnswer(from, sdp);
    };

    const onIce = (payload: any) => {
      const { from, candidate } = payload || {};
      if (!from || !candidate) return;
      // eslint-disable-next-line no-console
      console.log("[Room] Received ICE candidate from:", from);
      handleIceCandidate(from, candidate);
    };

    on("presence:update", onPresence);
    on("points:update", onPointsUpdate);
    on("chat:message", onChat);
    on("webrtc:offer", onOffer);
    on("webrtc:answer", onAnswer);
    on("webrtc:ice", onIce);

    // custom handlers to bridge RTC helpers with socket emits
    const createOfferHandler = async (e: any) => {
      const to = e.detail?.to;
      if (!to) return;
      // eslint-disable-next-line no-console
      console.log("[Room] createOfferHandler: Creating offer to", to);
      const off = await createOffer(to);
      emit("webrtc:offer", { to, sdp: off });
    };

    const iceCandidateHandler = (e: any) => {
      const { to, candidate } = e.detail || {};
      if (!to || !candidate) return;
      emit("webrtc:ice", { to, candidate });
    };

    window.addEventListener(
      "webrtc-create-offer",
      createOfferHandler as EventListener
    );
    window.addEventListener(
      "webrtc-ice-candidate",
      iceCandidateHandler as EventListener
    );

    // handle remote tracks
    setRemoteTrackCallback((socketId, stream) => {
      // attach to audio element dynamically
      const elId = `audio-${socketId}`;
      let el = document.getElementById(elId) as HTMLAudioElement | null;
      if (!el) {
        el = document.createElement("audio");
        el.id = elId;
        el.autoplay = true;
        el.muted = false;
        el.volume = 1;
        document.body.appendChild(el);
        // eslint-disable-next-line no-console
        console.log(`[audio] Created new audio element #${elId}`);
      }
      el.srcObject = stream;
      el.muted = false;
      el.volume = 1;

      // Check if stream has audio tracks
      const audioTracks = stream.getAudioTracks();
      // eslint-disable-next-line no-console
      console.log(
        `[audio] Stream has ${audioTracks.length} audio tracks:`,
        audioTracks
      );

      el.play()
        .then(() => {
          // eslint-disable-next-line no-console
          console.log(`[audio] ✅ Audio element #${elId} is playing!`, {
            paused: el!.paused,
            muted: el!.muted,
            volume: el!.volume,
            readyState: el!.readyState,
          });
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error("❌ Remote audio play() failed:", err);
        });
    });

    return () => {
      off("presence:update", onPresence);
      off("points:update", onPointsUpdate);
      off("chat:message", onChat);
      off("webrtc:offer", onOffer);
      off("webrtc:answer", onAnswer);
      off("webrtc:ice", onIce);
      window.removeEventListener(
        "webrtc-create-offer",
        createOfferHandler as EventListener
      );
      window.removeEventListener(
        "webrtc-ice-candidate",
        iceCandidateHandler as EventListener
      );
      // cleanup webrtc
      cleanup();
      leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // re-join on username selection
    if (username) {
      // expose quick globals for small UI components (Presence) to use
      (window as any).__currentRoomId = roomId;
      (window as any).__currentUserId = userIdRef.current;
      (window as any).__currentUsername = username;
      join(roomId, userIdRef.current, username);
    }
  }, [username, roomId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Room {roomId}</h2>
        <Link to="/rooms" className="text-sm text-indigo-600 hover:underline">
          Back to rooms
        </Link>
      </div>

      {!username ? (
        <div className="p-6 bg-white border rounded-md">
          <label className="block">
            <div className="text-sm font-medium mb-2">Enter display name</div>
            <input
              className="px-3 py-2 border rounded w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) setUsername(val);
                }
              }}
              placeholder="Enter your display name and press Enter"
            />
          </label>
          {!hasMic && (
            <div className="mt-3 text-xs text-rose-600">
              <b>Warning:</b> Microphone is not enabled. Please allow mic access
              for voice chat to work.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Presence
              users={users}
              meSocketId={meSocket.current ?? undefined}
            />
          </div>

          <div className="col-span-2">
            <div className="space-y-4">
              {/* Audio Debug Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="font-semibold mb-1">🎤 Voice Chat Status:</div>
                <div>Mic Enabled: {hasMic ? "✅ Yes" : "❌ No"}</div>
                <div>Participants: {users.length}</div>
                <div className="mt-2 text-blue-600">
                  <strong>Note:</strong> You won't hear yourself (prevents
                  echo). Speak in one window and listen in the other window.
                </div>
                <button
                  onClick={() => {
                    const audioElements = document.querySelectorAll(
                      'audio[id^="audio-"]'
                    );
                    // eslint-disable-next-line no-console
                    console.log(
                      `[DEBUG] Found ${audioElements.length} audio elements:`
                    );
                    audioElements.forEach((el: any) => {
                      // eslint-disable-next-line no-console
                      console.log(`  - ${el.id}:`, {
                        paused: el.paused,
                        muted: el.muted,
                        volume: el.volume,
                        hasSrcObject: !!el.srcObject,
                        tracks: el.srcObject?.getTracks?.()?.length || 0,
                      });
                    });
                    alert(
                      `Found ${audioElements.length} audio element(s). Check console for details.`
                    );
                  }}
                  className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  🔍 Check Audio Elements
                </button>
              </div>

              <AudioControls
                onMicEnabled={async () => {
                  setHasMic(true);
                  
                  // AGGRESSIVE FIX: Close all existing connections and restart fresh
                  const { cleanup: cleanupWebRTC } = await import('../lib/webrtc');
                  cleanupWebRTC();
                  
                  // Wait a moment for cleanup
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Now create fresh offers to ALL users
                  const s = getSocket();
                  // eslint-disable-next-line no-console
                  console.log(
                    "[Room] Mic enabled. Restarting all connections. My socket:",
                    s?.id,
                    "Users in room:",
                    users
                  );
                  
                  if (s && s.id) {
                    // Clear the offered peers set
                    offeredPeers.current.clear();
                    
                    for (const usr of users) {
                      if (usr.socketId && usr.socketId !== s.id) {
                        // eslint-disable-next-line no-console
                        console.log(
                          "[Room] Creating fresh offer to:",
                          usr.socketId,
                          usr.username
                        );
                        offeredPeers.current.add(usr.socketId);
                        window.dispatchEvent(
                          new CustomEvent("webrtc-create-offer", {
                            detail: { to: usr.socketId },
                          })
                        );
                      }
                    }
                  }
                }}
                onError={(err) => {
                  // eslint-disable-next-line no-console
                  console.error("[AudioControls] Error:", err);
                }}
              />

              <Chat
                messages={messages}
                onSend={(msg) => {
                  emit("chat:message", {
                    roomId,
                    userId: userIdRef.current,
                    message: msg,
                    ts: Date.now(),
                  });
                }}
              />

              <div className="mt-4">
                <Leaderboard entries={leaderboard} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
