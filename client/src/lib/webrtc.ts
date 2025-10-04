type RemoteTrackCallback = (socketId: string, stream: MediaStream) => void;

const pcMap = new Map<string, RTCPeerConnection>();
let localStream: MediaStream | null = null;
let remoteTrackCb: RemoteTrackCallback | null = null;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Free TURN server for NAT traversal
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

export async function initLocalAudio(): Promise<MediaStream> {
  if (localStream) {
    return localStream;
  }
  
  localStream = await navigator.mediaDevices.getUserMedia({ 
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    } 
  });
  
  console.log('[webrtc] Local audio initialized');
  
  // Add local tracks to any existing peer connections that don't have them yet
  pcMap.forEach((pc, remoteSocketId) => {
    const senders = pc.getSenders();
    if (senders.length === 0) {
      localStream!.getTracks().forEach(track => {
        pc.addTrack(track, localStream!);
        console.log('[webrtc] Added track to existing peer connection:', remoteSocketId);
      });
    }
  });
  
  return localStream;
}

export function hasLocalStream(): boolean {
  return localStream !== null;
}

export function setRemoteTrackCallback(cb: RemoteTrackCallback) {
  remoteTrackCb = cb;
}

export function createPeerConnection(remoteSocketId: string): RTCPeerConnection {
  if (pcMap.has(remoteSocketId)) {
    return pcMap.get(remoteSocketId)!;
  }

  const pc = new RTCPeerConnection(ICE_SERVERS);

  // Add local tracks if available (may not be if we haven't enabled mic yet)
  if (localStream) {
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream!);
      console.log('[webrtc] Added track to', remoteSocketId);
    });
  } else {
    console.log('[webrtc] Creating peer connection without local stream (mic not enabled yet)');
  }

  pc.ontrack = (event) => {
    console.log('[webrtc] Received track from', remoteSocketId);
    if (event.streams && event.streams[0] && remoteTrackCb) {
      remoteTrackCb(remoteSocketId, event.streams[0]);
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      window.dispatchEvent(new CustomEvent('webrtc-ice-candidate', {
        detail: { to: remoteSocketId, candidate: event.candidate }
      }));
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log('[webrtc] ICE state', remoteSocketId, pc.iceConnectionState);
  };

  pcMap.set(remoteSocketId, pc);
  return pc;
}

export async function createOffer(remoteSocketId: string): Promise<RTCSessionDescriptionInit> {
  const pc = createPeerConnection(remoteSocketId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.log('[webrtc] Created offer for', remoteSocketId);
  return offer;
}

export async function handleOffer(fromSocketId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
  const pc = createPeerConnection(fromSocketId);
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  console.log('[webrtc] Created answer for', fromSocketId);
  return answer;
}

export async function handleAnswer(fromSocketId: string, answer: RTCSessionDescriptionInit): Promise<void> {
  const pc = pcMap.get(fromSocketId);
  if (!pc) return;
  if (pc.signalingState === 'stable') return;
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
  console.log('[webrtc] Set answer for', fromSocketId);
}

export async function handleIceCandidate(fromSocketId: string, candidate: RTCIceCandidateInit): Promise<void> {
  const pc = pcMap.get(fromSocketId);
  if (!pc) return;
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}

export function cleanup(): void {
  pcMap.forEach(pc => pc.close());
  pcMap.clear();
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
}

export function setMuted(muted: boolean): void {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }
}
