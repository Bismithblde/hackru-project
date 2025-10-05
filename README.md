# 🐰 StudyBunny - Collaborative Study Platform

A feature-rich real-time collaborative study platform built for HackRU Fall 2024 with video meetings, whiteboard, chat, quizzes, time tracking, and gamification!

## ✨ Features

### Core Collaboration
- 🎥 **Video Meetings** - HD video/audio via Daily.co
- 🎨 **Collaborative Whiteboard** - Real-time drawing with Excalidraw and debounced sync
- 💬 **Live Chat** - Instant messaging with typing indicators and sound effects
- 👥 **Presence System** - See who's online with animated participant cards
- 🔔 **Toast Notifications** - Beautiful success/error/info/warning notifications

### Gamification & Productivity
- 🏆 **Persistent Leaderboard** - MongoDB-backed points system with real-time updates
- 📝 **Interactive Quizzes** - Create and take quizzes with instant feedback
- ⏱️ **Time Tracking** - Track study sessions per room with MongoDB persistence
- � **Sound Effects** - Web Audio API sounds for actions (with toggle)

### Authentication & Security
- 🔐 **User Authentication** - Unique usernames with bcrypt password hashing
- 👤 **User Profiles** - Display names and session management
- 🔒 **Protected Sessions** - localStorage-based session persistence

### User Experience
- 💾 **Persistent Data** - MongoDB Atlas for whiteboards, rooms, time tracking, and users
- 🔄 **Real-time Sync** - Socket.io for instant updates across all features
- 🎨 **Custom Design** - Modern UI with custom color scheme and animated particles
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- ⚡ **Loading States** - Smooth spinners and feedback for all actions
- 🎯 **Empty States** - Helpful CTAs when no data is available

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (FREE tier available)
- Daily.co API key (FREE tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/Bismithblde/hackru-project.git
cd hackru-project

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Setup MongoDB Atlas

1. Create free account at https://cloud.mongodb.com
2. Create M0 FREE cluster
3. Create database user with username/password
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string (replace <password> with your actual password)

### Environment Variables

Create `server/.env`:

```env
PORT=4000
MONGODB_URI=mongodb+srv://your-user:password@cluster.mongodb.net/studybunny
DAILY_API_KEY=your-daily-api-key
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Run Development Servers

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

Visit: http://localhost:5173

## 🎨 Color Scheme

StudyBunny uses a custom vibrant color palette:
- 🔴 Red: #c41610ff
- 🟠 Orange: #da8f02ff  
- 🔵 Blue: #068bb0ff
- 🟡 Yellow: #ecbe08ff
- 🟢 Green: #cdf4c6ff

## 🏗️ Tech Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Socket.io Client** - Real-time communication
- **Excalidraw** - Collaborative whiteboard
- **Daily.co React** - Video meetings
- **Web Audio API** - Sound effects

### Backend

- **Node.js + Express** - Server framework
- **Socket.io** - WebSocket server for real-time features
- **MongoDB + Mongoose** - Database and ODM
- **bcryptjs** - Password hashing
- **Daily.co API** - Video infrastructure
- **CORS & Helmet** - Security

### Database Collections

- **Users** - Authentication with unique usernames
- **Rooms** - Room metadata and persistent leaderboards
- **Whiteboards** - Saved drawing data
- **TimeTracking** - Study session tracking per room
- **Quiz** - Quiz questions and metadata

### Infrastructure

- **MongoDB Atlas** - Cloud database (FREE tier)
- **Daily.co** - Video infrastructure
- **Socket.io** - Real-time bidirectional communication

## 📂 Project Structure

```
hackru-project/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Chat.tsx
│   │   │   ├── Whiteboard.tsx
│   │   │   ├── Presence.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── TimeTracker.tsx
│   │   │   ├── Quiz.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── CreateRoomModal.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Room.tsx
│   │   │   ├── Rooms.tsx
│   │   │   ├── Auth.tsx
│   │   │   └── SavedWhiteboard.tsx
│   │   ├── contexts/         # React context
│   │   │   ├── AuthContext.tsx
│   │   │   └── ToastContext.tsx
│   │   ├── services/         # API services
│   │   │   ├── authService.ts
│   │   │   └── api.ts
│   │   └── lib/              # Utilities
│   └── package.json
│
├── server/                   # Node.js backend
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   │   ├── socketController.js
│   │   │   └── whiteboardController.js
│   │   ├── models/           # Database models
│   │   │   ├── User.js
│   │   │   ├── Room.js
│   │   │   ├── Whiteboard.js
│   │   │   ├── TimeTracking.js
│   │   │   └── Quiz.js
│   │   ├── routes/           # API routes
│   │   │   ├── authRoutes.js
│   │   │   └── roomRoutes.js
│   │   ├── config/           # Configuration
│   │   │   └── database.js
│   │   └── index.js          # Server entry
│   └── package.json
│
└── README.md                 # This file
```

## 🎮 Usage

### Authentication

1. **Sign Up** - Create account with unique username and secure password
2. **Login** - Access your account and join rooms
3. **Session** - Stay logged in with localStorage persistence

### Creating a Room

1. Click "Create Room" on the Rooms page
2. Enter room name and unique room code
3. Room appears in active rooms list
4. Share the code with friends!

### Joining a Room

1. Click "Join Room" or use the join button next to a room
2. Enter the room code
3. Start collaborating immediately!

### Using the Whiteboard

- Draw, write, and create shapes collaboratively
- Real-time sync with 150ms debouncing for smooth performance
- Click "Save Whiteboard" to get a shareable link
- Expand to fullscreen for better drawing experience
- All drawings persist in MongoDB

### Video Meeting

- Click "Show Meeting" to toggle video panel
- Join the Daily.co room automatically
- Mute/unmute audio/video as needed
- HD quality video and audio

### Chat & Communication

- Send messages in real-time chat
- See typing indicators when others are typing
- Hear sound effects for new messages (toggle available)
- Scroll through message history

### Quizzes

- Create interactive quizzes for the room
- Take quizzes with instant feedback
- See real-time notifications when quizzes are created
- Track quiz completion and scores

### Time Tracking

- Automatic time tracking per room
- View total study time for each session
- Data persists across sessions in MongoDB
- See aggregated statistics

### Leaderboard & Points

- Earn points for participation and activities
- Compete on the persistent leaderboard
- Points sync in real-time across all users
- Leaderboard data stored in MongoDB Room documents

## 🌐 Deployment

**Recommended:** Render, Railway, or Fly.io

### Quick Deploy Steps

1. Push code to GitHub
2. Create account on deployment platform
3. Connect GitHub repository
4. Configure environment variables
5. Deploy! 🚀

### Environment Variables for Production

**Server:**
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `CORS_ALLOWED_ORIGINS` - Your frontend URL
- `DAILY_API_KEY` - Daily.co API key
- `PORT` - Server port (usually auto-assigned)

**Client:**
- `VITE_API_URL` - Your deployed backend URL

## 🔒 Environment Variables

### Server

| Variable               | Required    | Description                     |
| ---------------------- | ----------- | ------------------------------- |
| `MONGODB_URI`          | ✅ Yes      | MongoDB Atlas connection string |
| `CORS_ALLOWED_ORIGINS` | ✅ Yes      | Frontend URL(s) for CORS        |
| `DAILY_API_KEY`        | ⚠️ Optional | For video meetings              |
| `PORT`                 | ⚠️ Optional | Server port (default: 4000)     |

### Client

| Variable       | Required | Description     |
| -------------- | -------- | --------------- |
| `VITE_API_URL` | ✅ Yes   | Backend API URL |

## 💾 Database Schema

### Users Collection

```javascript
{
  username: String,         // Unique, lowercase, 3-20 chars
  password: String,         // bcrypt hashed
  displayName: String,      // Display name for UI
  createdAt: Date,
  lastLoginAt: Date
}
```

### Rooms Collection

```javascript
{
  roomId: String,           // Unique room identifier
  roomName: String,         // Display name
  code: String,             // Join code
  participants: Array,      // Current participants
  leaderboard: [{           // Persistent leaderboard
    userId: String,
    username: String,
    points: Number,
    lastUpdated: Date
  }],
  createdAt: Date,
  isActive: Boolean
}
```

### Whiteboards Collection

```javascript
{
  whiteboardId: String,     // Unique ID
  roomId: String,           // Room reference
  elements: Array,          // Drawing data
  appState: Object,         // Excalidraw state
  createdAt: Date,
  updatedAt: Date,
  viewCount: Number,
  isDeleted: Boolean
}
```

### TimeTracking Collection

```javascript
{
  roomId: String,           // Room reference
  userId: String,           // User reference
  totalTime: Number,        // Total milliseconds
  sessions: [{              // Individual sessions
    startTime: Date,
    endTime: Date,
    duration: Number
  }],
  lastUpdated: Date
}
```

### Quiz Collection

```javascript
{
  roomId: String,           // Room reference
  title: String,            // Quiz title
  questions: [{             // Quiz questions
    question: String,
    options: [String],
    correctAnswer: Number
  }],
  createdBy: String,        // Creator username
  createdAt: Date
}
```

## 🧪 Testing

```bash
# Run backend server
cd server
npm run dev

# Run frontend
cd client
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build
```

## 🎯 Key Features Implemented

✅ **Authentication System** - Unique usernames with bcrypt hashing  
✅ **Persistent Leaderboard** - MongoDB-backed points system  
✅ **Time Tracking** - Per-room session tracking  
✅ **Interactive Quizzes** - Create and take quizzes  
✅ **Toast Notifications** - 4 types with animations  
✅ **Sound Effects** - Web Audio API with toggle  
✅ **Typing Indicators** - See who's typing in real-time  
✅ **Whiteboard Debouncing** - Smooth sync with 150ms/100ms delays  
✅ **Loading States** - Spinners and feedback everywhere  
✅ **Empty States** - Helpful CTAs when no data  
✅ **Custom Branding** - Vibrant color scheme with particle animations  
✅ **Professional Navbar** - Clean, modern design  
✅ **Copy Feedback** - Visual confirmation for copied codes  
✅ **Responsive Design** - Mobile and desktop optimized  
✅ **Session Persistence** - localStorage-based auth  
✅ **Real-time Sync** - Socket.io for all features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Built for **HackRU Fall 2024** hackathon
- **Daily.co** for video infrastructure
- **MongoDB Atlas** for database hosting
- **Excalidraw** for the amazing whiteboard component
- **Socket.io** for real-time magic
- **React + TypeScript** for type-safe UI development
- **TailwindCSS** for rapid styling

## 🎯 Future Enhancements

Potential features for future development:
- [ ] Private rooms with password protection
- [ ] File sharing and attachments
- [ ] Screen sharing capability
- [ ] Mobile native app
- [ ] Whiteboard templates library
- [ ] Chat message persistence
- [ ] Push notifications
- [ ] Calendar integration
- [ ] Advanced Pomodoro timer
- [ ] AI study assistant
- [ ] Study analytics dashboard
- [ ] Export study session reports

---

**Made with ❤️ for HackRU**

🐰 Happy Studying!
