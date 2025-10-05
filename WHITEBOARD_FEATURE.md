# 🎨 Whiteboard Feature Documentation

## Overview

The whiteboard feature allows users in a study room to collaboratively draw, write, and share visual ideas in real-time using Excalidraw.

## Features

### ✨ Core Capabilities

- **Drawing Tools**: Pen, line, rectangle, circle, arrow, text, and more
- **Image Support**: Upload and place images on the whiteboard
- **Real-time Collaboration**: Live sync toggle to share changes with others
- **Export**: Save whiteboard as PNG/SVG image
- **Canvas Background**: Change canvas background color

### 🔄 Collaboration

- Toggle "Live Sync" button to enable/disable real-time collaboration
- When enabled, all drawing changes are instantly broadcast to other room members
- Each user can work independently or collaborate together

## Technical Implementation

### Client-Side (`client/src/components/Whiteboard.tsx`)

```typescript
- Uses @excalidraw/excalidraw library
- Socket.IO for real-time synchronization
- Manages local state with excalidrawAPI
- Emits "whiteboard-change" events when drawing
- Listens for "whiteboard-update" events from others
```

### Server-Side (`server/src/controllers/socketController.js`)

```javascript
socket.on("whiteboard-change", (payload) => {
  // Broadcasts changes to all other users in the room
  socket.to(roomId).emit("whiteboard-update", { elements });
});
```

### Room Integration (`client/src/pages/Room.tsx`)

- Tab system: Chat | Whiteboard
- Whiteboard takes up full 2/3 column width
- Shares socket connection with other room features

## Usage

### For Users

1. Join a study room
2. Click the **"🎨 Whiteboard"** tab
3. Use the drawing tools on the left sidebar
4. Toggle **"Live Sync"** button (top-right) to enable collaboration
5. Draw, add text, upload images, etc.
6. Changes are instantly visible to all users with Live Sync enabled

### For Developers

To add whiteboard to a room:

```tsx
import Whiteboard from "../components/Whiteboard";
import { getSocket } from "../lib/socket";

<Whiteboard socket={getSocket()!} roomId={roomId} />;
```

## Socket Events

### `whiteboard-change`

**Direction**: Client → Server  
**Payload**:

```typescript
{
  roomId: string;
  elements: ExcalidrawElement[];
}
```

### `whiteboard-update`

**Direction**: Server → Clients  
**Payload**:

```typescript
{
  elements: ExcalidrawElement[];
}
```

## Performance Considerations

- Live Sync is OFF by default to reduce network traffic
- Only changes are broadcast (not entire canvas state)
- Socket.IO handles efficient binary data transfer
- Excalidraw is optimized for large canvases

## Future Enhancements

- [ ] Persist whiteboard state to database
- [ ] Load saved whiteboards when rejoining room
- [ ] Per-user cursor positions
- [ ] Whiteboard access controls
- [ ] Version history / undo across sessions
- [ ] Export to PDF
- [ ] Template library (math formulas, diagrams, etc.)

## Dependencies

- `@excalidraw/excalidraw` (v0.17.x or later)
- `socket.io-client` (existing)
- React 18+

## Known Issues

- Whiteboard state is not persisted (resets on page refresh)
- No conflict resolution for simultaneous edits
- Large images may slow down synchronization

---

**Installed**: October 4, 2025  
**Library**: Excalidraw - https://excalidraw.com
