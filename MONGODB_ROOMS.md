# MongoDB Room Persistence Implementation

## Overview

Rooms are now persisted in MongoDB for better reliability and data persistence. This replaces the previous in-memory Map storage with a robust database solution.

## Features

### ✅ Persistent Rooms

- Rooms stored in MongoDB survive server restarts
- Automatic unique 6-digit code generation
- Room settings and metadata persisted

### ✅ Participant Tracking

- Track who's in each room
- Active/inactive participant status
- Join/leave timestamps
- Last seen tracking

### ✅ Room Analytics

- Total joins counter
- Total messages counter
- Total quizzes counter
- Last activity tracking

### ✅ Auto-Expiration

- Rooms expire after 7 days of inactivity
- Activity extends expiration automatically
- TTL index handles cleanup

### ✅ Room Settings

- Public/private rooms
- Feature toggles (chat, whiteboard, video, quiz)
- Maximum participants limit

## Database Schema

```javascript
{
  code: String (6 digits, unique),
  name: String,
  createdBy: String,
  description: String,
  maxParticipants: Number (default: 10),

  participants: [
    {
      userId: String,
      username: String,
      joinedAt: Date,
      isActive: Boolean,
      lastSeen: Date
    }
  ],

  settings: {
    isPublic: Boolean,
    allowChat: Boolean,
    allowWhiteboard: Boolean,
    allowVideo: Boolean,
    allowQuiz: Boolean
  },

  analytics: {
    totalJoins: Number,
    totalMessages: Number,
    totalQuizzes: Number
  },

  isActive: Boolean,
  lastActivityAt: Date,
  expiresAt: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## API Endpoints

### POST /api/rooms/create

Create a new room

```json
{
  "name": "Study Group",
  "createdBy": "Alice",
  "description": "Math study session",
  "maxParticipants": 10,
  "settings": {
    "isPublic": true
  }
}
```

### GET /api/rooms

Get all active rooms (limit: 100)

### GET /api/rooms/:code

Get specific room by code

### POST /api/rooms/join

Join a room (validates existence)

```json
{
  "code": "123456",
  "username": "Bob"
}
```

### DELETE /api/rooms/:code

Delete/deactivate a room

### GET /api/rooms/:code/stats

Get detailed room statistics

## Socket Integration

### On Join

```javascript
// Automatically:
// 1. Adds user to Socket.io room
// 2. Adds user to in-memory presence
// 3. Starts time tracking
// 4. Adds participant to MongoDB room
// 5. Sends chat history
```

### On Message

```javascript
// Automatically increments:
// room.analytics.totalMessages
// room.lastActivityAt
```

### On Quiz Create

```javascript
// Automatically increments:
// room.analytics.totalQuizzes
// room.lastActivityAt
```

### On Disconnect

```javascript
// Automatically:
// 1. Ends time tracking
// 2. Marks participant as inactive
// 3. Updates lastSeen timestamp
```

## Service Methods

```javascript
const mongoRoomService = require("./services/mongoRoomService");

// Create room
const room = await mongoRoomService.createRoom({
  name: "Study Room",
  createdBy: "Alice",
});

// Get room
const room = await mongoRoomService.getRoom("123456");

// Join room
await mongoRoomService.joinRoom("123456", "user-id", "Bob");

// Leave room
await mongoRoomService.leaveRoom("123456", "user-id");

// Update activity (extends expiration)
await mongoRoomService.updateActivity("123456");

// Increment counters
await mongoRoomService.incrementMessages("123456");
await mongoRoomService.incrementQuizzes("123456");

// Get stats
const stats = await mongoRoomService.getRoomStats("123456");

// Cleanup inactive participants (30+ min)
await mongoRoomService.cleanupInactiveParticipants("123456", 30);
```

## Indexes

Optimized for performance:

- `code` (unique)
- `createdAt` (desc)
- `lastActivityAt` (desc)
- `isActive + createdAt` (compound)
- `createdBy + createdAt` (compound)
- `expiresAt` (TTL, auto-delete)

## Migration from In-Memory

### Before

```javascript
const rooms = new Map();
rooms.set(code, { id, code, name, createdBy, createdAt });
```

### After

```javascript
const mongoRoomService = require("./services/mongoRoomService");
const room = await mongoRoomService.createRoom({ name, createdBy });
```

## Benefits

1. **Persistence**: Rooms survive server restarts
2. **Scalability**: MongoDB handles large datasets
3. **Analytics**: Track usage patterns
4. **Cleanup**: Automatic expiration of old rooms
5. **Reliability**: ACID transactions, backups
6. **Flexibility**: Easy to add new fields
7. **Performance**: Indexed queries are fast

## Error Handling

All MongoDB operations are wrapped in try-catch blocks with fallbacks:

```javascript
try {
  await mongoRoomService.joinRoom(roomId, userId, username);
} catch (err) {
  console.error("[Socket] Error adding participant:", err.message);
  // Room still works - MongoDB is optional enhancement
}
```

This ensures the app continues to function even if MongoDB operations fail.

## Testing

### Create a Room

```bash
curl -X POST http://localhost:4000/api/rooms/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room","createdBy":"Alice"}'
```

### Get Room

```bash
curl http://localhost:4000/api/rooms/123456
```

### Get All Rooms

```bash
curl http://localhost:4000/api/rooms
```

### Get Stats

```bash
curl http://localhost:4000/api/rooms/123456/stats
```

## Future Enhancements

- [ ] Room passwords/invites
- [ ] Room templates
- [ ] Scheduled room sessions
- [ ] Room categories/tags
- [ ] Advanced permissions system
- [ ] Room history export
- [ ] Usage analytics dashboard
