# Client Code Structure

This document explains the modular architecture of the client application.

## 📁 Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── AudioControls.tsx
│   ├── Chat.tsx
│   ├── Leaderboard.tsx
│   └── Presence.tsx
│
├── constants/          # Application constants and configuration
│   ├── config.ts       # Server URL, Socket events, Daily.co config
│   └── index.ts        # Barrel export
│
├── hooks/              # Custom React hooks
│   ├── useRoom.ts      # Socket room state management
│   ├── useDailyRoom.ts # Daily.co room fetching
│   └── index.ts        # Barrel export
│
├── lib/                # External service integrations
│   ├── daily/          # Daily.co voice chat
│   │   ├── audioManager.ts    # Audio element management
│   │   ├── callManager.ts     # Call object lifecycle
│   │   ├── eventHandlers.ts   # Event listener setup
│   │   └── index.ts           # Public API
│   └── socket.ts       # Socket.IO client wrapper
│
├── pages/              # Page components (routes)
│   ├── Home.tsx
│   ├── Rooms.tsx
│   └── Room.tsx
│
├── types/              # TypeScript type definitions
│   ├── user.ts         # User and leaderboard types
│   ├── message.ts      # Chat message types
│   ├── daily.ts        # Daily.co types
│   └── index.ts        # Barrel export
│
├── utils/              # Utility functions
│   ├── format.ts       # Formatting helpers
│   ├── validation.ts   # Validation helpers
│   └── index.ts        # Barrel export
│
├── App.tsx             # Root component
└── main.tsx            # Application entry point
```

## 🎯 Best Practices Implemented

### 1. **Separation of Concerns**

- **Components**: Pure UI components with minimal logic
- **Hooks**: Business logic and state management
- **Lib**: External service integrations
- **Utils**: Pure helper functions

### 2. **Type Safety**

- All types centralized in `/types` directory
- Barrel exports for easy imports
- Strict TypeScript configuration

### 3. **Modularity**

- Daily.co functionality split into logical modules:
  - `audioManager`: Handles audio element lifecycle
  - `callManager`: Manages Daily call object
  - `eventHandlers`: Centralizes event handling
- Each module has a single responsibility

### 4. **Constants Management**

- All magic strings moved to `/constants`
- Socket events as typed constants
- Configuration in one place

### 5. **Custom Hooks**

- `useRoom`: Abstracts socket room logic
- `useDailyRoom`: Handles Daily.co room fetching
- Reusable across components

### 6. **Code Reusability**

- Utility functions for common operations
- Barrel exports (`index.ts`) for cleaner imports
- Consistent naming conventions

## 📦 Import Patterns

### Good ✅

```typescript
import { User, Message } from "../types";
import { formatTime, isValidUsername } from "../utils";
import { SOCKET_EVENTS, SERVER_URL } from "../constants";
import { useRoom, useDailyRoom } from "../hooks";
```

### Avoid ❌

```typescript
import { User } from "../types/user";
import { formatTime } from "../utils/format";
// Use barrel exports instead
```

## 🔧 Adding New Features

### Adding a new component:

1. Create in `/components`
2. Define types in `/types`
3. Add any utilities in `/utils`
4. Export from respective `index.ts`

### Adding a new service:

1. Create directory in `/lib`
2. Split into logical modules
3. Create `index.ts` with public API
4. Add types to `/types`

### Adding a custom hook:

1. Create in `/hooks`
2. Use existing types from `/types`
3. Export from `/hooks/index.ts`

## 🧪 Testing Strategy

- **Components**: Test UI rendering and user interactions
- **Hooks**: Test state management and side effects
- **Utils**: Test pure functions with various inputs
- **Types**: Ensure type safety at compile time

## 📚 Code Style

- **Naming**:

  - Components: PascalCase (`UserProfile.tsx`)
  - Hooks: camelCase with `use` prefix (`useAuth.ts`)
  - Utils: camelCase (`formatDate.ts`)
  - Types: PascalCase (`User`, `Message`)
  - Constants: UPPER_SNAKE_CASE (`SOCKET_EVENTS`)

- **File Organization**:

  - One component per file
  - Types colocated with related functionality
  - Barrel exports for public APIs

- **Imports**:
  - External imports first
  - Internal imports second
  - Types imported separately with `type` keyword
