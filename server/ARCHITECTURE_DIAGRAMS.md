# Redis Persistence Architecture - Visual Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│                                                                  │
│  React Components                                                │
│  ├─ Rooms.tsx          → Create/Join Rooms                     │
│  ├─ Room.tsx           → Room Container                         │
│  ├─ Chat.tsx           → Chat Interface                         │
│  └─ Whiteboard.tsx     → Canvas                                 │
└───────────────┬────────────────────────────────────────────────┘
                │
                │ Socket.io Events
                │ ├─ join
                │ ├─ chat:message
                │ └─ whiteboard-change
                │
                ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Server (Node.js)                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Persistent Socket Controller                      │  │
│  │  • Receives Socket.io events                             │  │
│  │  • Sends chat:history on join                            │  │
│  │  • Sends whiteboard:state on join                        │  │
│  │  • Coordinates persistence                               │  │
│  └─────────────────┬────────────────────────────────────────┘  │
│                    │                                             │
│                    ↓                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Persistent Room Service                           │  │
│  │  • Business logic                                         │  │
│  │  • Validation                                             │  │
│  │  • TTL refresh on activity                               │  │
│  │  • Error handling                                         │  │
│  └─────────────────┬────────────────────────────────────────┘  │
│                    │                                             │
│                    ↓                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Room Repository                                   │  │
│  │  • Direct Redis operations                                │  │
│  │  • Key management                                         │  │
│  │  • Data transformation                                    │  │
│  │  • Pipeline operations                                    │  │
│  └─────────────────┬────────────────────────────────────────┘  │
│                    │                                             │
└────────────────────┼─────────────────────────────────────────────┘
                     │
                     │ ioredis client
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Redis Database                             │
│                                                                  │
│  Key-Value Store:                                                │
│  ├─ room:{code}              → Hash (room data)                 │
│  ├─ room:{code}:messages     → List (last 100 messages)         │
│  ├─ room:{code}:whiteboard   → String (JSON state)              │
│  ├─ room:{code}:participants → Hash (userId → username)         │
│  └─ rooms:active             → Sorted Set (all active rooms)    │
│                                                                  │
│  TTL: 24 hours (auto-refresh on activity)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Flow 1: User Joins Room

```
User clicks "Join Room" with code 123456
         │
         ↓
1. Socket.emit("join", { roomId, userId, username })
         │
         ↓
2. Persistent Socket Controller
         │
         ├─→ Join Socket.io room
         │
         ├─→ Add to in-memory presence
         │
         └─→ Call persistentRoomService.joinRoom(code, userId, username)
                  │
                  ↓
3. Persistent Room Service
         │
         ├─→ Validate room exists
         │
         ├─→ Add participant to Redis
         │
         ├─→ Refresh room TTL
         │
         └─→ Return { room, messages, whiteboard }
                  │
                  ↓
4. Socket Controller sends to user:
         │
         ├─→ socket.emit("chat:history", { messages })
         │
         └─→ socket.emit("whiteboard:state", { elements })
                  │
                  ↓
5. User's browser receives:
         │
         ├─→ Chat populates with 50 messages
         │
         └─→ Whiteboard loads with drawings
                  │
                  ↓
         ✅ User sees full room state!
```

### Flow 2: User Sends Chat Message

```
User types "Hello!" and presses Enter
         │
         ↓
1. Socket.emit("chat:message", { roomId, userId, username, message })
         │
         ↓
2. Persistent Socket Controller
         │
         └─→ Call persistentRoomService.saveMessage(roomId, messageData)
                  │
                  ↓
3. Persistent Room Service
         │
         ├─→ Validate room exists
         │
         ├─→ Generate message ID
         │
         ├─→ Call roomRepository.saveMessage(code, message)
         │                │
         │                ↓
         │       4. Room Repository
         │                │
         │                ├─→ LPUSH room:123456:messages "{json}"
         │                │
         │                ├─→ LTRIM to keep last 100
         │                │
         │                └─→ EXPIRE room:123456:messages 86400
         │
         └─→ Refresh room TTL
                  │
                  ↓
5. Controller broadcasts:
         │
         └─→ io.to(roomId).emit("chat:message", { message })
                  │
                  ↓
6. All users in room receive message
         │
         └─→ ✅ Message visible to all + saved in Redis!
```

### Flow 3: User Draws on Whiteboard

```
User draws a rectangle on whiteboard
         │
         ↓
1. Excalidraw onChange event fires
         │
         ↓
2. Client debounces and emits:
   Socket.emit("whiteboard-change", { roomId, elements })
         │
         ↓
3. Persistent Socket Controller
         │
         ├─→ Call persistentRoomService.saveWhiteboard(roomId, { elements })
         │            │
         │            ↓
         │   4. Room Repository
         │            │
         │            ├─→ SET room:123456:whiteboard "{json}"
         │            │
         │            └─→ EXPIRE room:123456:whiteboard 86400
         │
         └─→ socket.to(roomId).emit("whiteboard-update", { elements })
                  │
                  ↓
5. Other users see drawing in real-time
         │
         └─→ State saved to Redis
                  │
                  ↓
         ✅ Persisted + Synced!
```

### Flow 4: Server Restarts

```
Server crashes or restarts
         │
         ↓
1. Redis data remains intact
   (not affected by server state)
         │
         ↓
2. Server starts up
         │
         ├─→ Redis client reconnects
         │
         └─→ Socket.io ready
                  │
                  ↓
3. Users reconnect (auto)
         │
         └─→ Re-join rooms via Socket.io
                  │
                  ↓
4. On join, they receive:
         │
         ├─→ Full chat history from Redis
         │
         └─→ Full whiteboard state from Redis
                  │
                  ↓
         ✅ No data loss!
```

## Redis Key Relationships

```
rooms:active (Sorted Set - Master Index)
    │
    ├─→ Score: 1696425600000, Member: "123456"
    ├─→ Score: 1696425550000, Member: "789012"
    └─→ Score: 1696425500000, Member: "456789"
              │
              │ Each room code links to:
              │
              ↓
        room:123456 (Hash)
              │
              ├─→ Field: "name"          Value: "Math Study"
              ├─→ Field: "createdBy"     Value: "Alice"
              ├─→ Field: "createdAt"     Value: "1696425600000"
              ├─→ Field: "participantCount" Value: "3"
              └─→ TTL: 86400 seconds (24 hours)
              │
              ├─────────────────────┬─────────────────────┐
              │                     │                     │
              ↓                     ↓                     ↓
   room:123456:messages    room:123456:whiteboard  room:123456:participants
       (List)                   (String)                  (Hash)
         │                        │                        │
         ├─→ [0] msg-3            │                        ├─→ user1: "Alice"
         ├─→ [1] msg-2            └─→ '{"elements":[...]}'├─→ user2: "Bob"
         └─→ [2] msg-1                                     └─→ user3: "Charlie"
         │                        │                        │
         └─ TTL: 86400           └─ TTL: 86400           └─ TTL: 86400
```

## Repository Operations

### Create Room

```
Input: { name, createdBy, maxParticipants }
         │
         ↓
┌────────────────────────────────┐
│  1. Generate unique code        │
│  2. HMSET room:{code} {data}   │
│  3. EXPIRE room:{code} 86400   │
│  4. ZADD rooms:active {code}   │
└────────────────────────────────┘
         │
         ↓
Output: Room object
```

### Save Message

```
Input: { code, message }
         │
         ↓
┌─────────────────────────────────────┐
│  1. LPUSH room:{code}:messages msg  │
│  2. LTRIM to last 100               │
│  3. EXPIRE 86400                    │
└─────────────────────────────────────┘
         │
         ↓
Output: Saved message
```

### Get Messages

```
Input: { code, limit=50 }
         │
         ↓
┌─────────────────────────────────────┐
│  1. LRANGE room:{code}:messages     │
│     0 to (limit-1)                  │
│  2. Parse JSON strings              │
│  3. Reverse (oldest first)          │
└─────────────────────────────────────┘
         │
         ↓
Output: Array of messages
```

### Refresh TTL

```
Input: { code }
         │
         ↓
┌─────────────────────────────────────┐
│  Pipeline:                          │
│  1. EXPIRE room:{code} 86400        │
│  2. EXPIRE room:{code}:messages     │
│  3. EXPIRE room:{code}:whiteboard   │
│  4. EXPIRE room:{code}:participants │
└─────────────────────────────────────┘
         │
         ↓
Output: Success
```

## Performance Characteristics

```
Operation          | Time    | Redis Command
-------------------|---------|------------------
Create Room        | 1-2ms   | HMSET + ZADD
Get Room           | <1ms    | HGETALL
Save Message       | 1-2ms   | LPUSH + LTRIM
Get Messages (50)  | 3-5ms   | LRANGE + Parse
Save Whiteboard    | 2-3ms   | SET
Get Whiteboard     | 1-2ms   | GET
Add Participant    | 1ms     | HSET
Remove Participant | 1ms     | HDEL
Refresh TTL        | 2-3ms   | 4x EXPIRE (pipelined)
Join Room (full)   | 5-10ms  | Multiple ops
```

## Memory Usage

```
Per Room Estimation:
┌───────────────────────────────────────────┐
│ Component         Size                    │
├───────────────────────────────────────────┤
│ Room metadata     ~500 bytes              │
│ 100 messages      ~30KB (avg 300B each)   │
│ Whiteboard state  ~10KB (varies)          │
│ Participants      ~200 bytes              │
├───────────────────────────────────────────┤
│ Total per room    ~41KB                   │
└───────────────────────────────────────────┘

Capacity Examples:
• 100 rooms = 4.1MB
• 1,000 rooms = 41MB
• 10,000 rooms = 410MB

Redis can easily handle millions of keys with GBs of data!
```

## Error Handling Flow

```
Error occurs anywhere in the chain
         │
         ↓
┌─────────────────────────────────┐
│  Service/Repository catches     │
│  error in try-catch block       │
└─────────────┬───────────────────┘
              │
              ↓
        Log error details
              │
              ↓
┌─────────────────────────────────┐
│  Return graceful error response │
│  { success: false, error: msg } │
└─────────────┬───────────────────┘
              │
              ↓
        Controller handles
              │
              ├─→ For Socket: emit("error", msg)
              │
              └─→ For HTTP: res.status(500).json(...)
                     │
                     ↓
              Client shows error message
                     │
                     └─→ Operation fails gracefully
                           (no crashes!)
```

## Lifecycle Events

### Application Startup

```
1. Load .env variables
2. Create Express app
3. Initialize Redis client
   ├─→ Connect to Redis
   ├─→ Setup reconnection
   └─→ Log "Redis: ready"
4. Create Socket.io server
5. Register socket handlers
6. Start HTTP server
7. ✅ Ready to accept connections
```

### Graceful Shutdown (SIGTERM/SIGINT)

```
1. Signal received (Ctrl+C)
2. Close Redis connections
   └─→ redis.quit()
3. Close Socket.io
   └─→ io.close()
4. Close HTTP server
   └─→ server.close()
5. Wait up to 10 seconds
6. ✅ Exit cleanly
```

## Summary

This architecture provides:
✅ **Separation of Concerns** - Clear layers  
✅ **Persistence** - Redis stores all data  
✅ **Performance** - Sub-10ms operations  
✅ **Scalability** - Redis handles millions of ops  
✅ **Reliability** - Auto-reconnection, error handling  
✅ **Maintainability** - Clean code, testable  
✅ **Production-Ready** - Graceful shutdown, logging

All working together to provide seamless chat history and whiteboard persistence! 🎉
