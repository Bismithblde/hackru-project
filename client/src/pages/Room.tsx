import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { connect, join, leave, on, off, emit, getSocket } from "../lib/socket";
import Presence from "../components/Presence";
import Chat from "../components/Chat";
import AudioControls from "../components/AudioControls";
import Leaderboard from "../components/Leaderboard";
import { createOffer, handleOffer, handleAnswer, setRemoteTrackCallback, handleIce as rtcHandleIce, initLocalAudio } from "../lib/webrtc";

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
  const [leaderboard, setLeaderboard] = useState<Array<{ userId: string; username: string; points: number }>>([]);

  useEffect(() => {
    connect();
    const socket = getSocket();
    if (socket) {
      meSocket.current = socket.id ?? null;
    }

    const connectedPeers = new Set<string>();

    const onPresence = (u: User[]) => {
      setUsers(u);
      const s = getSocket();
      if (s) meSocket.current = s.id ?? null;

      // For each remote user, attempt to create offer only if not already connected
      (async () => {
        for (const usr of u) {
          if (usr.socketId && usr.socketId !== meSocket.current && !connectedPeers.has(usr.socketId)) {
            // ensure mic is initialized before offering
            try {
              await (window as any).__initLocalAudioOnce();
            } catch (err) {
              // continue without mic
            }
            connectedPeers.add(usr.socketId);
            window.dispatchEvent(new CustomEvent('webrtc-create-offer', { detail: { to: usr.socketId } }));
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
      const answer = await handleOffer(from, sdp);
      emit('webrtc:answer', { to: from, sdp: answer });
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

    on('presence:update', onPresence);
  on('points:update', onPointsUpdate);
    on('chat:message', onChat);
    on('webrtc:offer', onOffer);
    on('webrtc:answer', onAnswer);
    on('webrtc:ice', onIce);

    // custom handlers to bridge RTC helpers with socket emits
    const createOfferHandler = async (e: any) => {
      const to = e.detail?.to;
      if (!to) return;
      // ensure local audio exists
      if ((window as any).__initLocalAudioOnce) await (window as any).__initLocalAudioOnce();
      const off = await createOffer(to);
      emit('webrtc:offer', { to, sdp: off });
    };

    const iceCandidateHandler = (e: any) => {
      const { to, candidate } = e.detail || {};
      if (!to || !candidate) return;
      emit('webrtc:ice', { to, candidate });
    };

    window.addEventListener('webrtc-create-offer', createOfferHandler as EventListener);
    window.addEventListener('webrtc-ice-candidate', iceCandidateHandler as EventListener);

    // handle remote tracks
    setRemoteTrackCallback((socketId, stream) => {
      // attach to audio element dynamically
      const elId = `audio-${socketId}`;
      let el = document.getElementById(elId) as HTMLAudioElement | null;
      if (!el) {
        el = document.createElement('audio');
        el.id = elId;
        el.autoplay = true;
        document.body.appendChild(el);
      }
      el.srcObject = stream;
    });

    return () => {
      off('presence:update', onPresence);
      off('points:update', onPointsUpdate);
      off('chat:message', onChat);
      off('webrtc:offer', onOffer);
      off('webrtc:answer', onAnswer);
      off('webrtc:ice', onIce);
      window.removeEventListener('webrtc-create-offer', createOfferHandler as EventListener);
      window.removeEventListener('webrtc-ice-candidate', iceCandidateHandler as EventListener);
      // stop and cleanup webrtc (async-safe)
      (async () => {
        try {
          const wk = await import('../lib/webrtc');
          wk.stopAll();
          wk.closeAllRemoteAudioElements();
        } catch (err) {
          console.warn('webrtc cleanup failed', err);
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
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
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
                  <div className="text-xs text-slate-600">Socket id: <span className="font-mono">{meSocket.current ?? '—'}</span></div>
                  <div className="text-xs text-slate-600">Participants: <span className="font-mono">{users.length}</span></div>

                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                      onClick={() => {
                        // inspect audio elements in DOM
                        const els = Array.from(document.querySelectorAll('audio[id^="audio-"]')) as HTMLAudioElement[];
                        const info = els.map((el) => ({ id: el.id, hasSrcObject: !!(el as any).srcObject, tracks: ((el as any).srcObject as MediaStream | null)?.getTracks?.().length ?? 0 }));
                        // show quick report
                        // eslint-disable-next-line no-console
                        console.log('audio-elements', info);
                        alert('Found ' + info.length + ' remote audio element(s). See console for details.');
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
                          const id = 'audio-local-loopback';
                          let el = document.getElementById(id) as HTMLAudioElement | null;
                          if (!el) {
                            el = document.createElement('audio');
                            el.id = id;
                            el.controls = true;
                            el.autoplay = true;
                            // small style so it isn't intrusive
                            el.style.position = 'fixed';
                            el.style.right = '12px';
                            el.style.bottom = '12px';
                            el.style.zIndex = '9999';
                            document.body.appendChild(el);
                          }
                          (el as any).srcObject = s;
                          alert('Local mic loopback started (use the small audio control at bottom-right to mute/unmute).');
                        } catch (err) {
                          // eslint-disable-next-line no-console
                          console.error('initLocalAudio failed', err);
                          alert('Could not access microphone: ' + (err && (err as Error).message));
                        }
                      }}
                    >
                      Play local mic (loopback)
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 mt-2">Tip: open a second browser or an incognito window, join the same room, and use the "Inspect remote audio elements" button to confirm remote streams were attached.</div>
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
