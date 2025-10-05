# StudyBunny MVP (Minimum Viable Product)

## 🎯 Project Overview

**StudyBunny** is a collaborative study platform that enables students to learn together in real-time through voice chat, messaging, and interactive whiteboards. The platform combines modern UI/UX design with powerful collaboration features to create an engaging study experience.

---

## ✨ Core Features (Implemented)

### 1. **Real-Time Voice Chat**

- **Technology**: Daily.co integration
- **Features**:
  - Crystal clear audio communication
  - Popup iframe interface (420x320px, bottom-right)
  - Microphone controls with mute/unmute
  - Participant tracking and status indicators
  - Audio element management for each participant
  - Error handling and user feedback

### 2. **Messenger-Style Chat**

- **Design**: Modern messenger-style bubbles
- **Features**:
  - User messages: Right-aligned, blue background (`bg-indigo-600`)
  - Other messages: Left-aligned, white background
  - Username display above messages
  - Timestamps for each message
  - Real-time message synchronization
  - Send messages with Enter key

### 3. **Collaborative Whiteboard**

- **Technology**: Excalidraw integration
- **Features**:
  - Full drawing toolkit (pen, shapes, arrows, text)
  - Image upload and placement
  - Live sync toggle for real-time collaboration
  - Export drawings as PNG/SVG
  - Canvas background customization
  - Error boundary for graceful failure handling
  - Fixed dimensions (500x600px) to prevent canvas errors

### 4. **User Presence System**

- **Features**:
  - Real-time user list
  - User avatars with initials
  - Socket ID display
  - Join/leave notifications
  - Active participant count

### 5. **Leaderboard & Gamification**

- **Features**:
  - Point-based ranking system
  - Award points to other users (1-10 points)
  - Rate limiting (3-second cooldown)
  - Top performers displayed
  - Username and score tracking

---

## 🎨 Design System

### **Color Palette** (shadcn-inspired)

- **Primary**: Indigo-600 (`#4f46e5`)
- **Background**: Slate-50 (`#f8fafc`)
- **Text**: Slate-900 (`#0f172a`)
- **Borders**: Slate-200/300
- **White**: Cards and chat bubbles

### **UI Principles**

- Solid colors over gradients
- Minimal shadows
- Clean borders (`border-slate-200`)
- Rounded corners (`rounded-lg` - 8px)
- Professional, modern aesthetic
- Responsive design (mobile-first)

### **Typography**

- Large, bold headings
- Inter/System font stack
- Clear hierarchy
- Readable paragraph text

---

## 🏗️ Technical Architecture

### **Frontend**

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router v6 (with v7 future flags)
- **Voice**: Daily.co (@daily-co/daily-js)
- **Whiteboard**: Excalidraw
- **Real-time**: Socket.io-client

### **Backend**

- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **API**: Daily.co REST API for room creation

### **Code Organization**

```
client/src/
├── assets/          # Images (bunny.png)
├── components/      # Reusable UI components
│   ├── AudioControls.tsx
│   ├── Chat.tsx
│   ├── Leaderboard.tsx
│   ├── Presence.tsx
│   └── Whiteboard.tsx
├── constants/       # Configuration constants
│   ├── config.ts    # SOCKET_EVENTS, SERVER_URL, DAILY_CONFIG
│   └── index.ts
├── hooks/           # Custom React hooks
│   ├── useRoom.ts           # Socket room state management
│   ├── useDailyRoom.ts      # Daily.co room fetching
│   └── index.ts
├── lib/            # Third-party integrations
│   ├── daily/      # Daily.co modular implementation
│   │   ├── audioManager.ts
│   │   ├── callManager.ts
│   │   ├── eventHandlers.ts
│   │   └── index.ts
│   └── socket.ts   # Socket.io wrapper
├── pages/          # Route pages
│   ├── Home.tsx    # Landing page with animations
│   ├── Rooms.tsx   # Room selection
│   └── Room.tsx    # Main study room interface
├── types/          # TypeScript types
│   ├── user.ts
│   ├── message.ts
│   ├── daily.ts
│   └── index.ts
└── utils/          # Helper functions
    ├── format.ts       # formatTime, truncate, etc.
    ├── validation.ts   # Input validation
    └── index.ts
```

---

## 🚀 Key Pages

### **1. Home Page** (`/`)

- **Hero Section**:
  - Giant animated bunny logo (up to 600x600px)
  - Bounces in on page load
  - Continuous floating animation
  - "StudyBunny" title
  - Descriptive tagline
  - "Get Started Free" and "Learn More" CTAs
- **Features Section**:
  - Three feature cards: Voice Chat, Messaging, Leaderboard
  - Fade-in animations on scroll
  - Hover effects
- **CTA Section**:
  - Final call-to-action
  - "Start Studying Now" button
- **Parallax Effects**:
  - Smooth scroll-linked animations
  - Hero fades and moves as you scroll
  - Buttons disappear cleanly

### **2. Rooms Page** (`/rooms`)

- Room selection interface
- Create or join existing rooms
- Room list with participant counts

### **3. Study Room** (`/rooms/:id`)

- **Layout**: Grid system (2/3 main content, 1/3 sidebar)
- **Components**:
  - User info card with voice controls
  - Participant presence list
  - **Tabbed Interface**:
    - 💬 Chat Tab: Messenger-style conversation
    - 🎨 Whiteboard Tab: Collaborative drawing
  - Leaderboard sidebar
  - Quick actions panel
- **Daily.co Integration**: Bottom-right popup iframe

---

## 🔌 Socket Events

### **Client → Server**

- `join`: Join a room with username
- `leave`: Leave a room
- `chat:message`: Send a chat message
- `points:award`: Award points to another user
- `whiteboard-change`: Broadcast whiteboard updates

### **Server → Client**

- `presence:update`: User list updates
- `chat:message`: New chat message
- `points:update`: Leaderboard updates
- `points:error`: Point awarding errors
- `whiteboard-update`: Whiteboard changes from others

---

## 📦 Dependencies

### **Frontend**

```json
{
  "@daily-co/daily-js": "^0.x.x",
  "@excalidraw/excalidraw": "^0.x.x",
  "framer-motion": "^11.x.x",
  "react": "^18.x.x",
  "react-dom": "^18.x.x",
  "react-router-dom": "^6.x.x",
  "socket.io-client": "^4.x.x",
  "uuid": "^9.x.x"
}
```

### **Backend**

```json
{
  "express": "^4.x.x",
  "socket.io": "^4.x.x",
  "cors": "^2.x.x",
  "axios": "^1.x.x"
}
```

---

## 🎯 User Flow

1. **Landing**: User arrives at home page, sees giant bunny and features
2. **Navigation**: Clicks "Get Started Free" → redirected to `/rooms`
3. **Room Selection**: User joins or creates a study room
4. **Username Entry**: Enters display name to join room
5. **Study Room**:
   - See other participants in real-time
   - Join voice chat (Daily.co popup)
   - Chat via messenger interface
   - Draw on collaborative whiteboard
   - Award points to helpful peers
   - View leaderboard rankings

---

## ✅ Best Practices Implemented

### **Code Quality**

- ✅ Modular file structure (types, constants, utils, hooks)
- ✅ TypeScript for type safety
- ✅ Barrel exports for clean imports
- ✅ Single Responsibility Principle
- ✅ Custom hooks for logic separation
- ✅ Error boundaries for graceful failures
- ✅ Consistent naming conventions

### **Performance**

- ✅ Vite for fast builds and HMR
- ✅ Lazy loading with React.lazy (potential)
- ✅ Optimized animations (GPU-accelerated transforms)
- ✅ Passive scroll listeners
- ✅ Socket.io for efficient real-time communication
- ✅ Canvas size constraints to prevent browser errors

### **UX/UI**

- ✅ Responsive design (mobile → desktop)
- ✅ Loading states and error messages
- ✅ Smooth animations (Framer Motion)
- ✅ Accessible color contrast
- ✅ Clear visual hierarchy
- ✅ Intuitive tab navigation

---

## 🐛 Known Issues & Solutions

### **Canvas Size Error** ✅ SOLVED

- **Problem**: Excalidraw canvas exceeded browser max size
- **Solution**:
  - Fixed dimensions (500x600px)
  - maxWidth: 1400px
  - Error boundary with fallback UI
  - Removed dynamic sizing

### **TypeScript Import Error** ⚠️ MINOR

- **Problem**: `./eventHandlers` module not found (IDE cache)
- **Solution**: Code compiles fine with Vite, just restart TS server

### **React Router Warnings** ✅ SOLVED

- **Problem**: Future flag warnings
- **Solution**: Added `v7_startTransition` and `v7_relativeSplatPath` flags

---

## 📈 Future Enhancements (Post-MVP)

### **Phase 2**

- [ ] Persist whiteboard state to database
- [ ] User authentication (OAuth, email/password)
- [ ] Room history and saved sessions
- [ ] File sharing (PDFs, images, documents)
- [ ] Screen sharing integration
- [ ] Pomodoro timer for study sessions

### **Phase 3**

- [ ] AI study assistant (Q&A, summaries)
- [ ] Flashcard system
- [ ] Quiz creation and sharing
- [ ] Calendar integration
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard

### **Phase 4**

- [ ] Monetization (premium features)
- [ ] University partnerships
- [ ] Study groups and communities
- [ ] Course integration
- [ ] Video recording and playback

---

## 🚢 Deployment

### **Frontend**

- **Platform**: Vercel / Netlify
- **Build**: `npm run build`
- **Environment Variables**:
  - `VITE_SERVER_URL`: Backend API URL
  - `VITE_DAILY_API_KEY`: Daily.co API key

### **Backend**

- **Platform**: Railway / Render / Heroku
- **Port**: 4000 (configurable)
- **Environment Variables**:
  - `PORT`: Server port
  - `DAILY_API_KEY`: Daily.co API key
  - `CORS_ORIGIN`: Allowed frontend origin

---

## 📊 Success Metrics

- **User Engagement**: Active study sessions per day
- **Collaboration**: Messages sent, whiteboard usage, voice minutes
- **Growth**: New users, room creation rate
- **Performance**: Page load time < 2s, real-time latency < 100ms
- **Quality**: Error rate < 1%, uptime > 99.5%

---

## 🎓 Target Audience

- **Primary**: College students studying in groups
- **Secondary**: High school students, online learners
- **Use Cases**:
  - Group projects
  - Exam preparation
  - Homework help
  - Study groups
  - Tutoring sessions

---

## 💡 Unique Value Proposition

**StudyBunny combines the simplicity of Discord with the productivity of Notion, creating a delightful study experience that makes learning together fun and effective.**

### **Differentiators**:

1. 🎨 **Modern UI/UX**: Clean, professional design that students love
2. 🐰 **Playful Branding**: Cute bunny mascot, gamification elements
3. ⚡ **Zero Friction**: No downloads, instant join, web-based
4. 🎯 **Focus on Studying**: Purpose-built for education, not generic chat
5. 🤝 **Collaboration First**: Whiteboard, points, leaderboard foster teamwork

---

## 📝 License

MIT License - Open source and free to use

---

## 👥 Team & Contributors

- **Developer**: Ryan (Bismithblde)
- **Repository**: https://github.com/Bismithblde/hackru-project
- **Tech Stack**: MERN-like (React, Node.js, Socket.io)

---

## 🎉 MVP Status: COMPLETE

**Version**: 1.0.0  
**Date**: October 4, 2025  
**Status**: ✅ Production Ready

All core features implemented, tested, and ready for user testing!

---

**Made with ❤️ by StudyBunny Team** 🐰
