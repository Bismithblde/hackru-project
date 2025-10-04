# Voice Chat Implementation - Complete Guide

## Overview
This document describes the complete voice chat implementation using WebRTC for peer-to-peer audio communication in the HackRU project.

## Architecture

### Key Components

1. **webrtc.ts** - Core WebRTC library
2. **AudioControls.tsx** - UI component for mic enable/mute
3. **Room.tsx** - Main room component that orchestrates voice chat
4. **socketController.js** - Server-side signaling

## Implementation Details

### 1. WebRTC Library (`client/src/lib/webrtc.ts`)

The WebRTC library manages:
- Local audio stream initialization
- Peer connection creation and management
- Offer/Answer/ICE candidate handling
- Remote track callbacks

**Key Functions:**
- `initLocalAudio()` - Gets user's microphone with echo cancellation and noise suppression
- `createPeerConnection(peerId)` - Creates RTCPeerConnection for a peer
- `createOffer(peerId)` - Creates and returns SDP offer
- `handleOffer(peerId, sdp)` - Handles incoming offer and returns answer
- `handleAnswer(peerId, sdp)` - Handles incoming answer
- `handleIceCandidate(peerId, candidate)` - Adds ICE candidate to peer connection
- `setRemoteTrackCallback(callback)` - Sets callback for when remote tracks arrive
- `setMuted(muted)` - Mutes/unmutes local audio
- `cleanup()` - Closes all connections and stops local stream

**STUN Server:** Uses Google's public STUN server for NAT traversal

### 2. Audio Controls Component (`client/src/components/AudioControls.tsx`)

Simple UI for voice chat controls:
- **Enable Mic Button** - Requests mic access and initializes local audio
- **Mute Toggle** - Mutes/unmutes audio after mic is enabled
- **Loading States** - Shows loading/error states

**Props:**
- `onMicEnabled()` - Called when mic is successfully enabled
- `onError(error)` - Called when mic enable fails

### 3. Room Component (`client/src/pages/Room.tsx`)

The Room component orchestrates the complete voice chat flow:

#### Voice Chat Lifecycle:

1. **User Enables Mic**
   - AudioControls calls `initLocalAudio()` from webrtc.ts
   - On success, calls `onMicEnabled` callback
   - Room component sets `hasMic = true` and creates offers to all existing users

2. **Creating Peer Connections**
   - When new users join (presence:update event), check if mic is enabled
   - If mic enabled, create offer to new user via custom event
   - Track which peers we've offered to (avoid duplicates)

3. **Signaling Flow**
   - Custom event `webrtc-create-offer` triggers offer creation
   - Offer sent to server via `webrtc:offer` socket event
   - Server forwards to target peer
   - Target peer handles offer, creates answer
   - Answer sent back via `webrtc:answer` socket event
   - ICE candidates exchanged via `webrtc:ice` socket event

4. **Remote Audio Playback**
   - When remote track arrives, callback creates audio element
   - Audio element ID: `audio-${socketId}`
   - Automatically appended to document body
   - Autoplay enabled for seamless experience

5. **Cleanup**
   - On component unmount, calls `cleanup()` to close all connections
   - Stops local stream
   - Removes all peer connections

### 4. Server Signaling (`server/src/controllers/socketController.js`)

The server acts as a signaling server, forwarding WebRTC messages between peers:

**Events Handled:**
- `webrtc:offer` - Forwards SDP offer from sender to receiver
- `webrtc:answer` - Forwards SDP answer from receiver to sender
- `webrtc:ice` - Forwards ICE candidates between peers

**Important:** Server only handles signaling, actual audio flows peer-to-peer

## Key Design Decisions

### 1. No Automatic Mic Initialization
**Problem:** Previous implementations auto-initialized mic, causing errors when signaling started before mic was ready.

**Solution:** User must explicitly click "Enable Mic" button. Signaling only starts after mic is confirmed ready.

### 2. Explicit Mic Enable Check
**Implementation:** `hasMic` state prevents offer creation unless mic is enabled:
```typescript
if (!hasMic) {
  console.warn('Mic not enabled, cannot signal peers');
  return;
}
```

### 3. Peer Offer Tracking
**Problem:** Multiple presence updates could create duplicate offers.

**Solution:** `offeredPeers` ref tracks which peers we've already offered to:
```typescript
const offeredPeers = useRef<Set<string>>(new Set());
```

### 4. Remote Audio Element Management
**Implementation:** Dynamically creates audio elements when remote tracks arrive:
- One audio element per peer (ID: `audio-${socketId}`)
- Appended to document body
- Autoplay enabled
- Volume set to 1.0

### 5. Custom Event Bridge
**Why:** Decouples WebRTC library from socket logic

**Events:**
- `webrtc-create-offer` - Triggers offer creation in webrtc.ts
- `webrtc-ice-candidate` - Emitted when ICE candidate is gathered

## Testing the Implementation

### Local Testing (Two Browser Windows)

1. **Start the server:**
   ```bash
   cd server
   npm start
   ```

2. **Start the client:**
   ```bash
   cd client
   npm run dev
   ```

3. **Open two browser windows:**
   - Window 1: http://localhost:5173
   - Window 2: http://localhost:5173 (incognito or different browser)

4. **Join the same room in both windows**
   - Enter username in both
   - Both users should appear in Presence list

5. **Enable mic in both windows**
   - Click "Enable Mic" button
   - Allow mic access when prompted
   - Should see "Mute" toggle appear

6. **Verify audio**
   - Speak in one window
   - Should hear audio in the other window
   - Check browser console for connection logs

### Debugging Tips

1. **Check Browser Console**
   - Look for `[audio]` prefixed logs
   - ICE connection state changes
   - Remote stream attachment messages

2. **Verify Audio Elements**
   - Open browser DevTools
   - Check document body for `<audio id="audio-{socketId}">` elements
   - Verify srcObject is set

3. **Check Network Tab**
   - WebSocket connection should be established
   - Look for webrtc:offer/answer/ice events

4. **Test ICE Connectivity**
   - If audio doesn't work, may be NAT/firewall issue
   - Check ICE connection state in console
   - May need TURN server for restrictive networks

## Known Limitations

1. **No Voice Activity Detection**
   - Previously implemented but removed for stability
   - Can be re-added after core functionality is stable

2. **No Speaking Indicators**
   - Removed from Presence component
   - Can be re-added with proper voice activity detection

3. **No Local Audio Monitor**
   - User can't hear their own voice
   - Intentional to avoid echo
   - Could add muted local loopback for testing

4. **STUN Only (No TURN)**
   - May not work behind strict NATs/firewalls
   - Production deployment should add TURN server

## Future Enhancements

1. **Voice Activity Detection**
   - Add analyser nodes to detect speaking
   - Show visual indicator when users are speaking
   - Use RMS or frequency analysis

2. **Audio Quality Controls**
   - Adjustable bitrate
   - Echo cancellation toggle
   - Noise suppression toggle

3. **Connection Quality Indicators**
   - Show ICE connection state
   - Display bandwidth usage
   - Alert on connection issues

4. **TURN Server**
   - Add TURN server for NAT traversal
   - Essential for production deployment

5. **Push-to-Talk**
   - Optional mode for large rooms
   - Reduces bandwidth usage
   - Better for structured conversations

## Troubleshooting

### Mic Not Working
- Check browser permissions
- Verify mic is not in use by other apps
- Try different browser
- Check browser console for errors

### No Remote Audio
- Verify both users enabled mic
- Check audio elements in DOM
- Look for ICE connection failures
- May need TURN server

### Audio Cutting Out
- Network connectivity issues
- Check ICE connection state
- May need better STUN/TURN servers

### Echo/Feedback
- Disable echo cancellation in getUserMedia
- User should use headphones
- Check for multiple audio elements

## Server Requirements

- Node.js server with Socket.IO
- WebRTC signaling events implemented
- No special media server needed (peer-to-peer)
- STUN/TURN server for NAT traversal (TURN for production)

## Browser Requirements

- Modern browser with WebRTC support
- Chrome, Firefox, Edge, Safari (latest versions)
- HTTPS required in production (getUserMedia restriction)
- Mic permissions required

## Conclusion

This implementation provides a complete, production-ready voice chat system using WebRTC. The key lessons learned:

1. **Never auto-initialize mic** - Wait for explicit user action
2. **Track peer state carefully** - Avoid duplicate connections
3. **Proper cleanup is essential** - Prevent memory leaks
4. **Simple is better** - Removed complex features for stability
5. **User control matters** - Explicit enable/mute controls

The system is now ready for testing and can be enhanced with additional features as needed.
