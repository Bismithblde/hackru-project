type RemoteTrackCallback = (socketId: string, stream: MediaStream) => void;

const pcMap = new Map<string, RTCPeerConnection>();
let localStream: MediaStream | null = null;
let remoteTrackCb: RemoteTrackCallback | null = null;

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // Free public TURN server for dev/testing only
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
};

export async function initLocalAudio() {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Add tracks to all existing peer connections
    for (const [peerId, pc] of pcMap.entries()) {
      for (const t of localStream.getTracks()) {
        // Only add if not already present
        const senders = pc.getSenders();
        if (!senders.some(s => s.track && s.track.id === t.id)) {
          try {
            pc.addTrack(t, localStream);
            // eslint-disable-next-line no-console
            console.log(`[webrtc] Added local track ${t.id} to peer ${peerId}`);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(`[webrtc] Failed to add track to peer ${peerId}:`, e);
          }
        }
      }
    }
  }
  // Log local stream tracks
  if (localStream) {
    for (const t of localStream.getTracks()) {
      // eslint-disable-next-line no-console
      console.log(`[webrtc] Local track: ${t.kind}, enabled=${t.enabled}, id=${t.id}`);
    }
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
  let pc = pcMap.get(remoteSocketId);
  if (pc) return pc;

  pc = new RTCPeerConnection(ICE_SERVERS);

  // Log ICE connection state for debugging
  pc.oniceconnectionstatechange = () => {
    // eslint-disable-next-line no-console
    console.log(`[webrtc] ICE state for ${remoteSocketId}:`, pc.iceConnectionState);
    // Dispatch ICE state to UI
    window.dispatchEvent(
      new CustomEvent('webrtc-ice-state', {
        detail: { peerId: remoteSocketId, state: pc.iceConnectionState },
      })
    );
  };

  // Always add local tracks if available
  if (localStream) {
    for (const t of localStream.getTracks()) {
      try {
        pc.addTrack(t, localStream);
        // eslint-disable-next-line no-console
        console.log(`[webrtc] Added local track ${t.id} to new peer ${remoteSocketId}`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`[webrtc] Track may already be added to peer ${remoteSocketId}:`, e);
        window.dispatchEvent(
          new CustomEvent('webrtc-error', {
            detail: { message: `Failed to add track to peer ${remoteSocketId}: ${e}` },
          })
        );
      }
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[webrtc] No localStream when creating peer ${remoteSocketId}`);
    window.dispatchEvent(
      new CustomEvent('webrtc-error', {
        detail: { message: `No localStream when creating peer ${remoteSocketId}` },
      })
    );
  }

  pc.ontrack = (ev) => {
    if (ev.streams && ev.streams[0] && remoteTrackCb) {
      // eslint-disable-next-line no-console
      console.log(`[webrtc] ontrack for ${remoteSocketId}, stream:`, ev.streams[0]);
      remoteTrackCb(remoteSocketId, ev.streams[0]);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[webrtc] ontrack fired but no stream or callback for ${remoteSocketId}`);
      window.dispatchEvent(
        new CustomEvent('webrtc-error', {
          detail: { message: `ontrack fired but no stream or callback for ${remoteSocketId}` },
        })
      );
    }
  };

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      window.dispatchEvent(
        new CustomEvent("webrtc-ice-candidate", {
          detail: { to: remoteSocketId, candidate: ev.candidate },
        })
      );
    }
  };

  pcMap.set(remoteSocketId, pc);
  return pc;
}

export async function createOffer(remoteSocketId: string) {
  const pc = createPeer(remoteSocketId);
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('webrtc-error', {
        detail: { message: `Failed to create/set offer for ${remoteSocketId}: ${e}` },
      })
    );
    throw e;
  }
}

export async function handleOffer(fromSocketId: string, sdp: any) {
  const pc = createPeer(fromSocketId);
  try {
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('webrtc-error', {
        detail: { message: `Failed to handle offer from ${fromSocketId}: ${e}` },
      })
    );
    throw e;
  }
}

export async function handleAnswer(fromSocketId: string, sdp: any) {
  const pc = pcMap.get(fromSocketId);
  if (!pc) {
    window.dispatchEvent(
      new CustomEvent('webrtc-error', {
        detail: { message: `No peer connection for handleAnswer from ${fromSocketId}` },
      })
    );
    return;
  }
  // Only set remote answer if in correct signaling state
  if (pc.signalingState === 'have-local-offer') {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      // eslint-disable-next-line no-console
      console.log(`[webrtc] setRemoteDescription(answer) for ${fromSocketId}, state now:`, pc.signalingState);
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent('webrtc-error', {
          detail: { message: `Failed to set remote answer for ${fromSocketId}: ${e}` },
        })
      );
    }
  } else if (pc.signalingState === 'stable') {
    // Silently ignore, this is benign and expected in some race conditions
    return;
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[webrtc] Skipped setRemoteDescription(answer) for ${fromSocketId}: signalingState=${pc.signalingState}`);
    window.dispatchEvent(
      new CustomEvent('webrtc-error', {
        detail: { message: `Skipped setRemoteDescription(answer) for ${fromSocketId}: signalingState=${pc.signalingState}` },
      })
    );
  }
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
