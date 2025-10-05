# Redis Setup for StudyBunny

## Quick Start

### Option 1: Using Docker (Recommended)

```powershell
# Pull and run Redis
docker run -d --name studybunny-redis -p 6379:6379 redis:latest

# Check if running
docker ps

# Test connection
docker exec -it studybunny-redis redis-cli ping
```

### Option 2: Memurai (Native Windows Redis)

1. Download from: https://www.memurai.com/get-memurai
2. Run installer
3. Memurai will start automatically as a Windows service
4. Test: Open PowerShell and run `redis-cli ping`

### Option 3: WSL (Windows Subsystem for Linux)

```bash
# In WSL terminal
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
redis-cli ping
```

## Verify Installation

```powershell
# Test connection
redis-cli ping
# Expected output: PONG

# Check version
redis-cli --version

# Test set/get
redis-cli SET test "Hello Redis"
redis-cli GET test
redis-cli DEL test
```

## Start Development Server

```powershell
cd server
npm install
npm run dev
```

You should see:

```
🗄️  Redis: ready
```

## Common Issues

### "redis-cli not found"

- If using Docker: `docker exec -it studybunny-redis redis-cli`
- If using Memurai: Add to PATH or use full path `C:\Program Files\Memurai\redis-cli.exe`

### "Connection refused"

- Check if Redis is running: `redis-cli ping`
- Check port: Default is 6379
- Restart Redis service

### Server can't connect

- Check `.env` file has correct REDIS_HOST and REDIS_PORT
- Make sure Redis is running on localhost:6379

## Success!

Once you see the server log:

```
🗄️  Redis: ready
```

You're all set! The app now has:
✅ Persistent rooms
✅ Chat history (last 100 messages)
✅ Whiteboard state persistence
✅ 24-hour auto-expiration
