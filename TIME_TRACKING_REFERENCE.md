# Time Tracking Quick Reference

## API Endpoints

### Get All Users in Room

```bash
GET /api/time-tracking/room/:roomId
```

**Response:**

```json
{
  "success": true,
  "roomId": "123",
  "users": [
    {
      "userId": "abc",
      "username": "Alice",
      "totalTime": 7200000,
      "sessionCount": 3,
      "isCurrentlyActive": true,
      "lastSeen": "2025-10-05T12:00:00Z"
    }
  ],
  "count": 1
}
```

### Get Specific User Stats

```bash
GET /api/time-tracking/room/:roomId/user/:userId
```

### Cleanup Stale Sessions

```bash
POST /api/time-tracking/cleanup
Content-Type: application/json

{
  "maxAgeMinutes": 60
}
```

## Service Functions

```javascript
const timeTrackingService = require("./services/timeTrackingService");

// Start tracking
await timeTrackingService.startTracking(roomId, userId, username);

// End tracking
await timeTrackingService.endTracking(roomId, userId);

// Get room stats
const stats = await timeTrackingService.getRoomTimeStats(roomId);

// Get user stats
const userStats = await timeTrackingService.getUserTimeStats(roomId, userId);

// Cleanup stale sessions
const cleanedCount = await timeTrackingService.cleanupStaleSessions(60);
```

## MongoDB Schema

```javascript
{
  roomId: String,         // Room identifier
  userId: String,         // User identifier (UUID)
  username: String,       // Display name
  sessionStart: Date,     // When session started
  sessionEnd: Date,       // When session ended (null if active)
  duration: Number,       // Session duration in ms
  totalTime: Number,      // Total time across all sessions
  isActive: Boolean,      // Currently active?
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

## Time Format Helper

```typescript
function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
```

## React Component Usage

```tsx
import TimeTracker from "../components/TimeTracker";

<TimeTracker roomId={roomId} currentUserId={userId} />;
```

## Configuration

### Cleanup Schedule

```javascript
// In server/src/index.js
setInterval(async () => {
  await timeTrackingService.cleanupStaleSessions(60);
}, 30 * 60 * 1000); // Every 30 minutes
```

### UI Refresh Rate

```typescript
// In TimeTracker.tsx
useEffect(() => {
  fetchTimeStats();
  const interval = setInterval(fetchTimeStats, 30000); // 30 seconds
  return () => clearInterval(interval);
}, [roomId]);
```

## Common Operations

### Check if User Has Active Session

```javascript
const session = await TimeTracking.findOne({
  roomId,
  userId,
  isActive: true,
});
```

### Get Top 5 Users by Time

```javascript
const stats = await timeTrackingService.getRoomTimeStats(roomId);
const top5 = stats.slice(0, 5);
```

### Calculate Session Duration

```javascript
const duration = session.sessionEnd - session.sessionStart;
// Returns milliseconds
```

### End All Sessions in Room

```javascript
await TimeTracking.updateMany(
  { roomId, isActive: true },
  { $set: { isActive: false, sessionEnd: new Date() } }
);
```

## Troubleshooting

### Sessions Not Starting

- Check MongoDB connection
- Verify socket join event is firing
- Check server logs for errors

### Stats Not Updating

- Check API_BASE_URL is correct
- Verify room ID matches
- Check network tab for failed requests

### Stale Sessions

- Run manual cleanup: `POST /api/time-tracking/cleanup`
- Check cleanup schedule is running
- Verify disconnect events are firing

## Testing

### Start a Session

```bash
# Join room via socket
socket.emit('join', {
  roomId: '123',
  userId: 'abc',
  username: 'Alice'
});
```

### Check Stats

```bash
curl http://localhost:4000/api/time-tracking/room/123
```

### Cleanup Test

```bash
curl -X POST http://localhost:4000/api/time-tracking/cleanup \
  -H "Content-Type: application/json" \
  -d '{"maxAgeMinutes": 1}'
```
