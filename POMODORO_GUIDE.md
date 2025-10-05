# Pomodoro Timer Feature - Implementation Guide

## Overview
Modern, synchronized Pomodoro timer system for study rooms with room creator controls and automatic point rewards.

## Features

### Core Functionality
- ✅ **Room Creator Control**: Only the person who creates the room can control the timer
- ✅ **Configurable Durations**: Set custom work/break times (default: 25 min work, 5 min break)
- ✅ **Synchronized Timer**: All participants see the same timer
- ✅ **Server-Side Accuracy**: Timer runs on server, not client (prevents cheating/drift)
- ✅ **Phase Completion Notifications**: Alerts when work/break ends
- ✅ **Bonus Points**: Automatic points when completing Pomodoro cycles

### Controls
- **Start**: Begin the Pomodoro timer
- **Pause**: Temporarily stop the timer
- **Reset**: Go back to idle state
- **Skip**: Jump to next phase (work ↔ break)
- **Configure**: Change work/break durations

## Socket Events

### Client → Server

```javascript
// Initialize Pomodoro for a room
socket.emit('pomodoro:init', {
  roomId: 'room123',
  userId: 'user456',
  config: {
    enabled: true,
    workDuration: 25,    // minutes
    breakDuration: 5     // minutes
  }
});

// Update configuration
socket.emit('pomodoro:config', {
  roomId: 'room123',
  userId: 'user456',
  config: {
    workDuration: 30,
    breakDuration: 10
  }
});

// Start timer
socket.emit('pomodoro:start', {
  roomId: 'room123',
  userId: 'user456'
});

// Pause timer
socket.emit('pomodoro:pause', {
  roomId: 'room123',
  userId: 'user456'
});

// Reset timer
socket.emit('pomodoro:reset', {
  roomId: 'room123',
  userId: 'user456'
});

// Skip to next phase
socket.emit('pomodoro:skip', {
  roomId: 'room123',
  userId: 'user456'
});

// Get current state
socket.emit('pomodoro:getState', {
  roomId: 'room123'
});
```

### Server → Client

```javascript
// Receive updated state
socket.on('pomodoro:state', (data) => {
  const { roomId, state } = data;
  // state = {
  //   config: { enabled, workDuration, breakDuration },
  //   isActive: boolean,
  //   currentPhase: 'work' | 'break' | 'idle',
  //   remainingSeconds: number,
  //   cyclesCompleted: number
  // }
});

// Timer tick (every second when active)
socket.on('pomodoro:tick', (data) => {
  const { roomId, state } = data;
  // Update UI with remaining seconds
});

// Phase completed
socket.on('pomodoro:phaseComplete', (data) => {
  const { roomId, completedPhase, cyclesCompleted } = data;
  // Show notification: "Work session complete! Time for a break"
});

// Bonus points awarded
socket.on('pomodoro:bonusPoints', (data) => {
  const { roomId, points, message } = data;
  // Show: "+5 points: Pomodoro work session completed!"
});

// Timer started
socket.on('pomodoro:started', (data) => {
  const { roomId, startedBy } = data;
  // Show: "Timer started by [username]"
});

// Phase skipped
socket.on('pomodoro:phaseSkipped', (data) => {
  const { roomId } = data;
  // Show: "Phase skipped"
});

// Error
socket.on('pomodoro:error', (data) => {
  const { message } = data;
  // Show error: "Only room creator can control timer"
});
```

## Frontend Implementation Example

### React Component Structure

```typescript
// components/PomodoroTimer.tsx
interface PomodoroTimerProps {
  roomId: string;
  userId: string;
  isCreator: boolean;
}

function PomodoroTimer({ roomId, userId, isCreator }: PomodoroTimerProps) {
  const [state, setState] = useState<PomodoroState | null>(null);
  
  useEffect(() => {
    // Listen for state updates
    socket.on('pomodoro:state', (data) => {
      if (data.roomId === roomId) {
        setState(data.state);
      }
    });
    
    socket.on('pomodoro:tick', (data) => {
      if (data.roomId === roomId) {
        setState(data.state);
      }
    });
    
    socket.on('pomodoro:phaseComplete', (data) => {
      if (data.roomId === roomId) {
        showNotification(`${data.completedPhase} complete!`);
      }
    });
    
    // Request current state
    socket.emit('pomodoro:getState', { roomId });
    
    return () => {
      socket.off('pomodoro:state');
      socket.off('pomodoro:tick');
      socket.off('pomodoro:phaseComplete');
    };
  }, [roomId]);
  
  const handleStart = () => {
    socket.emit('pomodoro:start', { roomId, userId });
  };
  
  const handlePause = () => {
    socket.emit('pomodoro:pause', { roomId, userId });
  };
  
  // ... render UI
}
```

### UI Display

```
┌────────────────────────────────────┐
│      🍅 Pomodoro Timer             │
│                                    │
│        ┌──────────────┐            │
│        │   24:35      │  ← Work    │
│        └──────────────┘            │
│                                    │
│  [▶ Start] [⏸ Pause] [↻ Reset]   │ ← Only for creator
│                                    │
│  Cycles completed: 3 🏆            │
└────────────────────────────────────┘
```

## Points System Integration

### Automatic Points
- **Work Session Complete**: +5 points per cycle
- **Display**: Toast notification with points earned

### Bonus Points Event
```javascript
socket.on('pomodoro:bonusPoints', ({ points, message }) => {
  showToast(`+${points} points: ${message}`);
  updateLeaderboard();
});
```

## Technical Details

### Server Architecture
```
server/src/
├── types/
│   └── pomodoro.ts           # TypeScript interfaces
├── services/
│   └── pomodoroService.ts    # Business logic
└── controllers/
    └── pomodoroController.js # Socket event handlers
```

### State Management
- **In-Memory Storage**: Per-room Pomodoro state (resets when room is empty)
- **Server-Side Ticker**: 1-second interval for accurate timing
- **Automatic Cleanup**: When last user leaves, timer stops and state clears

### Timer Accuracy
- Server ticks every 1 second
- Client receives `pomodoro:tick` events
- Client displays current remaining seconds
- No client-side timer drift

## Demo Flow for Hackathon

1. **Room Creator Setup**:
   - Create room
   - Enable Pomodoro: 25 min work / 5 min break
   - Invite friends to join

2. **Start Study Session**:
   - Click "Start Pomodoro"
   - Everyone sees: "🍅 24:59 remaining"
   - Focus on studying together

3. **Work Complete**:
   - Timer hits 00:00
   - Notification: "Work session complete! Take a break"
   - Everyone gets +5 points
   - Timer auto-starts 5-minute break

4. **Break Complete**:
   - Timer hits 00:00
   - Notification: "Break over! Back to work"
   - Timer auto-starts new 25-minute work session

5. **Leaderboard Update**:
   - Points accumulate with each cycle
   - Competitive studying ensues! 🎯

## Next Steps for Frontend

1. Create `PomodoroTimer` component
2. Add to Room page (only show if enabled)
3. Style with Tailwind/your CSS framework
4. Add sound notifications (optional)
5. Add visual progress ring (optional)
6. Test with multiple users

## Benefits for Demo

✅ **Engagement**: Timer creates urgency and structure  
✅ **Competition**: Bonus points motivate completion  
✅ **Collaboration**: Everyone synchronized together  
✅ **Simplicity**: One person controls, everyone benefits  
✅ **Scientifically Proven**: Pomodoro technique is well-known  

Perfect for showing "real studying" during demo! 🚀
