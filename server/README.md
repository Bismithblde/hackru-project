# HackRU - Server

Minimal Express + Socket.IO server for presence, chat, and WebRTC signaling used by the HackRU project.

Getting started

1. Install dependencies

```powershell
cd server
npm install
```

2. Run in development (uses nodemon)

```powershell
npm run dev
```

3. Run production

```powershell
npm start
```

Environment

- `PORT` — port to run the server (defaults to 4000)
- `CORS_ALLOWED_ORIGINS` — comma-separated origins allowed to connect (defaults to `*` for dev)

Security notes

- This server keeps presence in memory. For production, persist important data and use Redis for presence if you run multiple server instances.
- Validate and sanitize user input in the client and server. This server includes only basic validation.
- For production, restrict CORS_ALLOWED_ORIGINS and enable HTTPS / reverse proxy.
