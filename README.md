# 🐰 StudyBunny - Collaborative Study Rooms

A real-time collaborative study platform built for HackRU with video meetings, whiteboard, chat, and gamification!

## ✨ Features

- 🎥 **Video Meetings** - HD video/audio via Daily.co
- 🎨 **Collaborative Whiteboard** - Real-time drawing with Excalidraw
- 💬 **Live Chat** - Instant messaging with typing indicators
- 👥 **Presence System** - See who's online
- 🏆 **Gamification** - Earn points and compete on leaderboard
- 💾 **Persistent Whiteboards** - Save and share whiteboards (MongoDB Atlas)
- 🔄 **Real-time Sync** - Socket.io for instant updates
- 📱 **Responsive Design** - Works on mobile and desktop

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (FREE - see setup guide)
- Daily.co API key (FREE - for video)

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

### Setup MongoDB Atlas (5 minutes)

**See detailed guide:** [`MONGODB_SETUP.md`](./MONGODB_SETUP.md)

Quick steps:

1. Create free account at https://cloud.mongodb.com
2. Create M0 FREE cluster
3. Create database user
4. Get connection string

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

## 📖 Documentation

- **[MongoDB Setup Guide](./MONGODB_SETUP.md)** - Step-by-step MongoDB Atlas setup
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Deploy to Render, Railway, Fly.io
- **[Cloud Migration](./CLOUD_DATABASE_MIGRATION.md)** - Understanding the database architecture
- **[Persistent Whiteboards](./PERSISTENT_WHITEBOARDS.md)** - API documentation

## 🏗️ Tech Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **TailwindCSS** - Styling
- **Socket.io Client** - Real-time communication
- **Excalidraw** - Collaborative whiteboard
- **Daily.co** - Video meetings

### Backend

- **Node.js + Express** - Server framework
- **Socket.io** - WebSocket server
- **MongoDB + Mongoose** - Database
- **Daily.co API** - Video infrastructure

### Infrastructure

- **MongoDB Atlas** - Cloud database (FREE tier)
- **Render/Railway** - Deployment platforms
- **Daily.co** - Video infrastructure

## 📂 Project Structure

```
hackru-project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── Chat.tsx
│   │   │   ├── Whiteboard.tsx
│   │   │   ├── Presence.tsx
│   │   │   └── Leaderboard.tsx
│   │   ├── pages/         # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Room.tsx
│   │   │   └── SavedWhiteboard.tsx
│   │   ├── contexts/      # React context
│   │   └── lib/           # Utilities
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   │   ├── socketController.js
│   │   │   └── whiteboardController.js
│   │   ├── models/        # Database models
│   │   │   └── Whiteboard.js
│   │   ├── config/        # Configuration
│   │   │   └── database.js
│   │   ├── services/      # Business logic
│   │   └── index.js       # Server entry
│   └── package.json
│
├── MONGODB_SETUP.md       # MongoDB Atlas guide
├── DEPLOYMENT_GUIDE.md    # Production deployment
└── README.md              # This file
```

## 🎮 Usage

### Creating a Room

1. Click "Create Room"
2. Enter room name and code
3. Set your username
4. Share the code with friends!

### Joining a Room

1. Click "Join Room"
2. Enter room code
3. Set your username
4. Start collaborating!

### Using the Whiteboard

- Draw, write, and create shapes
- Toggle "Live Sync ON" for real-time collaboration
- Click "Save Whiteboard" to get a shareable link
- Expand to fullscreen for better drawing experience

### Video Meeting

- Click "Show Meeting" to toggle video
- Join the Daily.co room automatically
- Mute/unmute audio/video as needed

### Chat & Points

- Send messages in the chat
- Earn points for participation
- Compete on the leaderboard

## 🌐 Deployment

**Recommended:** Render (easiest) or Railway

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for full instructions.

Quick deploy:

1. Push to GitHub
2. Connect to Render/Railway
3. Set environment variables
4. Auto-deploy! 🚀

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

### Whiteboards Collection

```javascript
{
  whiteboardId: String,     // Unique ID
  roomId: String,           // Room reference
  elements: Array,          // Drawing data
  appState: Object,         // Excalidraw state
  createdAt: Date,          // Timestamp
  updatedAt: Date,          // Last modified
  viewCount: Number,        // Popularity
  isDeleted: Boolean        // Soft delete
}
```

## 🧪 Testing

```bash
# Test backend
cd server
npm test

# Test frontend
cd client
npm test

# Type checking
npm run type-check
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Built for **HackRU** hackathon
- **Daily.co** for video infrastructure
- **MongoDB Atlas** for database hosting
- **Excalidraw** for the amazing whiteboard
- **Socket.io** for real-time magic

## 📞 Support

- 📧 Issues: [GitHub Issues](https://github.com/Bismithblde/hackru-project/issues)
- 📖 Docs: See documentation files in root
- 💬 Questions: Open a discussion

## 🎯 Roadmap

- [ ] User authentication
- [ ] Private rooms with passwords
- [ ] File sharing
- [ ] Screen sharing
- [ ] Mobile app
- [ ] Whiteboard templates
- [ ] Chat message persistence
- [ ] Notifications
- [ ] Calendar integration
- [ ] Study timer (Pomodoro)

---

**Made with ❤️ for HackRU**

🐰 Happy Studying!
