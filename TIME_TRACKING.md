# Time Tracking Feature

## Overview
The time tracking feature automatically monitors how long each user spends in a study room. It uses MongoDB to persist session data and provides real-time statistics.

## Features

### Automatic Tracking
- **Session Start**: Time tracking begins automatically when a user joins a room
- **Session End**: Time tracking stops when a user disconnects or leaves
- **Multiple Sessions**: Tracks total time across multiple visits to the same room
- **Real-time Updates**: Stats refresh every 30 seconds in the UI

### Data Tracked
- Total time spent in the room (across all sessions)
- Number of sessions
- Active/inactive status
- Last seen timestamp
- Session start/end times

### Visual Display
- **Collapsible Widget**: Expandable time tracker in the room sidebar
- **Leaderboard Style**: Users ranked by total time spent
- **Medals**: 🥇🥈🥉 for top 3 users
- **Active Indicator**: Green pulse dot for currently active users
- **Personal Highlight**: "You" label and blue background for current user

## Architecture

### Backend Components

#### Model: `TimeTracking.js`
```javascript
{
  roomId: String,
  userId: String,
  username: String,
  sessionStart: Date,
  sessionEnd: Date,
  duration: Number,
  totalTime: Number,
  isActive: Boolean
}
```

#### Service: `timeTrackingService.js`
- `startTracking(roomId, userId, username)` - Start a new session
- `endTracking(roomId, userId)` - End the current session
- `getRoomTimeStats(roomId)` - Get stats for all users in a room
- `getUserTimeStats(roomId, userId)` - Get stats for a specific user
- `cleanupStaleSessions(maxAgeMinutes)` - Clean up orphaned sessions

#### API Routes: `/api/time-tracking`
- `GET /room/:roomId` - Get all user stats for a room
- `GET /room/:roomId/user/:userId` - Get specific user stats
- `POST /cleanup` - Manually trigger stale session cleanup

### Frontend Components

#### Component: `TimeTracker.tsx`
- Displays time statistics in a collapsible widget
- Auto-refreshes every 30 seconds
- Shows active users with pulse indicator
- Formats time as hours/minutes/seconds
- Ranks users by total time spent

## Integration

### Socket Events
Time tracking integrates seamlessly with existing socket events:
- **On Join**: `startTracking()` called when user joins room
- **On Disconnect**: `endTracking()` called when user disconnects

### Automatic Cleanup
- **Scheduled**: Every 30 minutes, stale sessions (>60 min) are cleaned up
- **On Disconnect**: Sessions end automatically when users leave
- **Manual**: Can be triggered via API endpoint

## Usage

### View Time Stats in UI
The TimeTracker component appears in the room sidebar:
1. Click the "⏱️ Time Tracking" header to expand
2. View your rank and total time spent
3. See who else is currently active
4. Stats update automatically every 30 seconds

### API Usage

**Get all users in a room:**
```bash
GET /api/time-tracking/room/909744
```

**Get specific user stats:**
```bash
GET /api/time-tracking/room/909744/user/abc-123-def
```

**Manually cleanup stale sessions:**
```bash
POST /api/time-tracking/cleanup
Content-Type: application/json

{
  "maxAgeMinutes": 60
}
```

## Response Format

```json
{
  "success": true,
  "roomId": "909744",
  "users": [
    {
      "userId": "abc-123",
      "username": "Alice",
      "totalTime": 3600000,
      "sessionCount": 2,
      "isCurrentlyActive": true,
      "lastSeen": "2025-10-05T12:30:00Z"
    }
  ],
  "count": 1
}
```

## Error Handling
- Non-critical errors won't crash the app
- Time tracking failures are logged but don't prevent room access
- Stale session cleanup runs automatically to prevent data issues
- Failed API requests show error message in UI

## Performance
- **Lightweight**: Minimal overhead on socket connections
- **Indexed**: MongoDB indexes on `roomId`, `userId`, and `isActive`
- **Efficient**: Only tracks active sessions, auto-cleanup prevents bloat
- **Scalable**: Can handle thousands of concurrent sessions

## Future Enhancements
- Export time reports as CSV/PDF
- Daily/weekly/monthly time summaries
- Study streak tracking
- Time-based achievements and badges
- Integration with leaderboard points system
