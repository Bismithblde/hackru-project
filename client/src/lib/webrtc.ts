type RemoteTrackCallback = (socketId: string, stream: MediaStream) => void;

const pcMap = new Map<string, RTCPeerConnection>();
let localStream: MediaStream | null = null;
let remoteTrackCb: RemoteTrackCallback | null = null;

const STUN = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export async function initLocalAudio() {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }
  return localStream;
}

export function hasPeer(remoteSocketId: string) {
  return pcMap.has(remoteSocketId);
}

export function setRemoteTrackCallback(cb: RemoteTrackCallback) {
  remoteTrackCb = cb;
}

export function createPeer(remoteSocketId: string) {
  if (pcMap.has(remoteSocketId)) return pcMap.get(remoteSocketId)!;

  const pc = new RTCPeerConnection(STUN);

  // add local tracks
  if (localStream) {
    for (const t of localStream.getTracks()) pc.addTrack(t, localStream);
  }

  pc.ontrack = (ev) => {
    if (ev.streams && ev.streams[0] && remoteTrackCb) remoteTrackCb(remoteSocketId, ev.streams[0]);
  };

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      // emit candidate via socket (caller should do this)
      window.dispatchEvent(new CustomEvent('webrtc-ice-candidate', { detail: { to: remoteSocketId, candidate: ev.candidate } }));
    }
  };

  pcMap.set(remoteSocketId, pc);
  return pc;
}

export async function createOffer(remoteSocketId: string) {
  const pc = createPeer(remoteSocketId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function handleOffer(fromSocketId: string, sdp: any) {
  const pc = createPeer(fromSocketId);
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function handleAnswer(fromSocketId: string, sdp: any) {
  const pc = pcMap.get(fromSocketId);
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
}

export function handleIce(fromSocketId: string, candidate: any) {
  const pc = pcMap.get(fromSocketId);
  if (!pc) return;
  pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
}

export function closePeer(remoteSocketId: string) {
  const pc = pcMap.get(remoteSocketId);
  if (pc) {
    pc.close();
    pcMap.delete(remoteSocketId);
  }
}

export function stopAll() {
  for (const [k, pc] of pcMap.entries()) {
    pc.close();
    pcMap.delete(k);
  }
  if (localStream) {
    for (const t of localStream.getTracks()) t.stop();
    localStream = null;
  }
}

export function closeAllRemoteAudioElements() {
  for (const id of Array.from(pcMap.keys())) {
    const elId = `audio-${id}`;
    const el = document.getElementById(elId);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
}
