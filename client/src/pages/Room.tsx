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
  handleIce as rtcHandleIce,
  initLocalAudio,
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
  const [speakingMap, setSpeakingMap] = useState<Record<string, boolean>>({});
  const analyserRefs = useRef<Record<string, { ctx: AudioContext, analyser: AnalyserNode, src: MediaStreamAudioSourceNode }>>({});
  // ICE state tracking
  const [iceStates, setIceStates] = useState<Record<string, string>>({});
  // Error reporting
  const [rtcErrors, setRtcErrors] = useState<string[]>([]);


  // Track which peers we've already offered to (persists across renders)
  const offeredPeers = useRef<Set<string>>(new Set());

  // Track if local mic is ready
  const [micReady, setMicReady] = useState(false);

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

      // For each remote user, attempt to create offer only if not already offered
      (async () => {
        // Block signaling until micReady is true
        if (!micReady) {
          // Wait for micReady to become true before proceeding
          let waited = 0;
          while (!micReady && waited < 5000) {
            await new Promise((res) => setTimeout(res, 100));
            waited += 100;
          }
          if (!micReady) {
            // eslint-disable-next-line no-console
            console.warn('Mic not ready after waiting, cannot signal peers');
            return;
          }
        }
        for (const usr of u) {
          if (
            usr.socketId &&
            usr.socketId !== meSocket.current &&
            !offeredPeers.current.has(usr.socketId)
          ) {
            offeredPeers.current.add(usr.socketId);
            window.dispatchEvent(
              new CustomEvent("webrtc-create-offer", {
                detail: { to: usr.socketId },
              })
            );
          }
        }
      })();
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
      // Reset offer state for this peer (allow renegotiation)
      offeredPeers.current.delete(from);
      const answer = await handleOffer(from, sdp);
      emit("webrtc:answer", { to: from, sdp: answer });
    };

    const onAnswer = async (payload: any) => {
      const { from, sdp } = payload || {};
      if (!from || !sdp) return;
      await handleAnswer(from, sdp);
    };

    const onIce = (payload: any) => {
      const { from, candidate } = payload || {};
      if (!from || !candidate) return;
      rtcHandleIce(from, candidate);
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
      // ensure local audio exists
      if (!micReady) {
        try {
          await initLocalAudio();
          setMicReady(true);
        } catch (err) {
          setMicReady(false);
          // eslint-disable-next-line no-console
          console.warn('Mic not ready, cannot create offer');
          return;
        }
      }
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
        el = document.createElement('audio');
        el.id = elId;
        el.autoplay = true;
        el.muted = false;
        el.volume = 1;
        document.body.appendChild(el);
      }
      el.srcObject = stream;
      el.muted = false;
      el.volume = 1;
      el.play().catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Remote audio play() failed:', err);
      });
      // eslint-disable-next-line no-console
      console.log(`[audio] attached remote stream to #${elId}`, stream);

      // --- Voice activity detection ---
      // Clean up any previous analyser for this socketId
      if (analyserRefs.current[socketId]) {
        analyserRefs.current[socketId].ctx.close();
        delete analyserRefs.current[socketId];
      }
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        analyserRefs.current[socketId] = { ctx, analyser, src };
        // Poll for volume
        const data = new Uint8Array(analyser.fftSize);
        let running = true;
        const check = () => {
          if (!running) return;
          analyser.getByteTimeDomainData(data);
          // Calculate RMS (root mean square) to detect voice
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          // Log RMS for debugging
          if (window.DEBUG_RMS) {
            // eslint-disable-next-line no-console
            console.log(`[audio] socketId=${socketId} RMS=`, rms);
          }
          // Lower threshold for easier detection
          const speaking = rms > 0.008;
          setSpeakingMap((prev) => ({ ...prev, [socketId]: speaking }));
          setTimeout(check, 150);
        };
        check();
        // Clean up on stream end
        stream.getTracks().forEach((t) => {
          t.addEventListener('ended', () => {
            running = false;
            setSpeakingMap((prev) => {
              const copy = { ...prev };
              delete copy[socketId];
              return copy;
            });
            ctx.close();
            delete analyserRefs.current[socketId];
          });
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Voice activity detection error:', err);
      }
    });

    // Listen for ICE state changes from webrtc.ts
    function iceStateListener(e: any) {
      const { peerId, state } = e.detail || {};
      if (peerId && state) {
        setIceStates((prev) => ({ ...prev, [peerId]: state }));
      }
    }
    window.addEventListener('webrtc-ice-state', iceStateListener);

    // Listen for RTC errors
    function rtcErrorListener(e: any) {
      const { message } = e.detail || {};
      if (message) setRtcErrors((prev) => [...prev, message]);
    }
    window.addEventListener('webrtc-error', rtcErrorListener);

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
  window.removeEventListener('webrtc-ice-state', iceStateListener);
  window.removeEventListener('webrtc-error', rtcErrorListener);
  // stop and cleanup webrtc (async-safe)
      (async () => {
        try {
          const wk = await import("../lib/webrtc");
          wk.stopAll();
          wk.closeAllRemoteAudioElements();
        } catch (err) {
          console.warn("webrtc cleanup failed", err);
        }
      })();
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
      // Automatically initialize local audio (mic) so tracks are ready for WebRTC
      initLocalAudio()
        .then(() => setMicReady(true))
        .catch(() => setMicReady(false));
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
          {!micReady && (
            <div className="mt-3 text-xs text-rose-600">
              <b>Warning:</b> Microphone is not enabled. Please allow mic access for voice chat to work.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Presence
              users={users}
              meSocketId={meSocket.current ?? undefined}
              speakingMap={speakingMap}
            />
          </div>

          <div className="col-span-2">
            <div className="space-y-4">
              <AudioControls
                onReady={() => {
                  /* mic ready */
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

              {/* Diagnostics panel to help debug WebRTC/audio */}
              <div className="mt-4 p-4 bg-slate-50 border rounded">
                <h3 className="text-sm font-medium mb-2">Diagnostics</h3>
                <div className="space-y-2">
                  <div className="text-xs text-slate-600">
                    Socket id:{" "}
                    <span className="font-mono">{meSocket.current ?? "—"}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Participants:{" "}
                    <span className="font-mono">{users.length}</span>
                  </div>

                  <div className="flex gap-2 mt-2">
                    {/* ICE connection state panel */}
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-slate-700">ICE Connection States</div>
                      <ul className="text-xs text-slate-600">
                        {Object.entries(iceStates).length === 0 ? (
                          <li>No peers yet</li>
                        ) : (
                          Object.entries(iceStates).map(([peer, state]) => (
                            <li key={peer}>
                              Peer <span className="font-mono">{peer}</span>: <span className="font-mono">{state}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                    {/* RTC error panel */}
                    {rtcErrors.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs font-semibold text-rose-700">RTC Errors</div>
                        <ul className="text-xs text-rose-600">
                          {rtcErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                      onClick={() => {
                        // inspect audio elements in DOM
                        const els = Array.from(
                          document.querySelectorAll('audio[id^="audio-"]')
                        ) as HTMLAudioElement[];
                        const info = els.map((el) => ({
                          id: el.id,
                          hasSrcObject: !!(el as any).srcObject,
                          tracks:
                            (
                              (el as any).srcObject as MediaStream | null
                            )?.getTracks?.().length ?? 0,
                        }));
                        // show quick report
                        // eslint-disable-next-line no-console
                        console.log("audio-elements", info);
                        alert(
                          "Found " +
                            info.length +
                            " remote audio element(s). See console for details."
                        );
                      }}
                    >
                      Inspect remote audio elements
                    </button>

                    <button
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-sm"
                      onClick={async () => {
                        try {
                          const s = await initLocalAudio();
                          // create or reuse a local loopback audio element so user can hear their mic
                          const id = "audio-local-loopback";
                          let el = document.getElementById(
                            id
                          ) as HTMLAudioElement | null;
                          if (!el) {
                            el = document.createElement("audio");
                            el.id = id;
                            el.controls = true;
                            el.autoplay = true;
                            // small style so it isn't intrusive
                            el.style.position = "fixed";
                            el.style.right = "12px";
                            el.style.bottom = "12px";
                            el.style.zIndex = "9999";
                            document.body.appendChild(el);
                          }
                          (el as any).srcObject = s;
                          alert(
                            "Local mic loopback started (use the small audio control at bottom-right to mute/unmute)."
                          );
                        } catch (err) {
                          // eslint-disable-next-line no-console
                          console.error("initLocalAudio failed", err);
                          alert(
                            "Could not access microphone: " +
                              (err && (err as Error).message)
                          );
                        }
                      }}
                    >
                      Play local mic (loopback)
                    </button>
                    <button
                      className="px-3 py-1 bg-rose-500 text-white rounded text-sm"
                      onClick={() => {
                        // award demo points to current user from a demo bot (for testing)
                        const room = (window as any).__currentRoomId || roomId;
                        const toId =
                          (window as any).__currentUserId || userIdRef.current;
                        const toName =
                          (window as any).__currentUsername ||
                          username ||
                          "you";
                        // pick 5 demo points
                        emit("points:award", {
                          roomId: room,
                          fromUserId: "demo-bot",
                          fromUsername: "DemoBot",
                          toUserId: toId,
                          toUsername: toName,
                          points: 5,
                          ts: Date.now(),
                        });
                        alert("Demo points awarded to " + toName + ".");
                      }}
                    >
                      Award demo points to me
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 mt-2">
                    Tip: open a second browser or an incognito window, join the
                    same room, and use the "Inspect remote audio elements"
                    button to confirm remote streams were attached.
                  </div>
                </div>
              </div>
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
