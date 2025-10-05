# Environment Setup Guide

This guide will help you set up all the necessary environment variables and configurations to run the StudyBunny application.

## Prerequisites

Before you begin, make sure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download here](https://git-scm.com/)

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Bismithblde/hackru-project.git
cd hackru-project
```

### 2. Install Dependencies

Install dependencies for both the client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set Up Server Environment Variables

Navigate to the `server` folder and create your `.env` file:

```bash
cd server
```

#### Copy the example file:
- **Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
- **Mac/Linux:**
  ```bash
  cp .env.example .env
  ```

#### Edit the `.env` file with your credentials:

Open `server/.env` in your text editor and fill in the following values:

```properties
PORT=4000
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Daily.co API key
# Get your API key from: https://dashboard.daily.co/developers
DAILY_API_KEY=your_daily_api_key_here

# MongoDB Atlas Connection String
# Get from: https://cloud.mongodb.com/ (see instructions below)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/studybunny?retryWrites=true&w=majority&appName=test

# Redis Configuration (Optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### 4. Set Up Client Environment Variables

Navigate to the `client` folder and create your `.env` file:

```bash
cd ../client
```

#### Copy the example file:
- **Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
- **Mac/Linux:**
  ```bash
  cp .env.example .env
  ```

#### Edit the `.env` file:

Open `client/.env` in your text editor:

**For local development (if running backend locally):**
```properties
VITE_SERVER_URL=http://localhost:4000
```

**For using deployed backend:**
```properties
VITE_SERVER_URL=https://hackru-project-server.onrender.com
```

---

## Required API Keys & Services

### 🔑 Daily.co API Key

Daily.co is used for video conferencing features.

1. **Create an account**: Go to [https://dashboard.daily.co/](https://dashboard.daily.co/)
2. **Sign up** for a free account
3. **Get your API key**:
   - Navigate to the **Developers** section
   - Copy your API key
4. **Add to `.env`**: Paste the key into `DAILY_API_KEY`

**Example:**
```properties
DAILY_API_KEY=c22afd83836bfee78b0c85c16d42438301c9243f66234ec0c087d1c2ddc751d8
```

---

### 🗄️ MongoDB Atlas Connection String

MongoDB Atlas is used for storing whiteboard data and other persistent information.

#### Option 1: Use the Team's MongoDB Cluster (Recommended)

Ask your team lead for:
- MongoDB connection string
- Database credentials (username & password)

Then update your `.env` file with the provided connection string.

#### Option 2: Create Your Own MongoDB Atlas Cluster (For Testing)

1. **Create an account**: Go to [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
2. **Sign up** for a free account
3. **Create a cluster**:
   - Click "Build a Cluster"
   - Select the **FREE tier** (M0 Sandbox)
   - Choose a cloud provider and region (closest to you)
   - Click "Create Cluster" (takes 3-5 minutes)

4. **Create a database user**:
   - Go to **Database Access** (left sidebar)
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and password (save these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

5. **Whitelist your IP address**:
   - Go to **Network Access** (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

6. **Get your connection string**:
   - Go to **Database** (left sidebar)
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user's password
   - Add the database name `studybunny` before the `?` in the URL

**Example:**
```properties
MONGODB_URI=mongodb+srv://ryan:YourPassword123@cluster0.abc123.mongodb.net/studybunny?retryWrites=true&w=majority&appName=test
```

**Important Notes:**
- Replace `<username>` with your database username
- Replace `<password>` with your database password
- Replace `<cluster>` with your cluster address
- Make sure `studybunny` is included as the database name

---

### 📦 Redis (Optional)

Redis is used for caching and session management. If you don't have Redis installed, the app will work without it, but some features may be slower.

#### To Install Redis:

**Windows:**
1. Download Redis from [https://redis.io/download](https://redis.io/download) or use WSL
2. Or use Docker: `docker run -d -p 6379:6379 redis`

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

If Redis is running locally, the default settings in `.env` should work:
```properties
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

---

## Running the Application

### 1. Start the Backend Server

```bash
cd server
npm start
```

You should see:
```
🚀 Server started successfully!
📡 HTTP Server: http://localhost:4000
🔌 Socket.io: Ready
🌐 CORS Origins: http://localhost:5173,http://localhost:5174
🔄 MongoDB: Attempting to connect...
✅ MongoDB: Connected successfully
📦 MongoDB: Database - studybunny
```

### 2. Start the Frontend (in a new terminal)

```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. Open the Application

Open your browser and go to: [http://localhost:5173](http://localhost:5173)

---

## Troubleshooting

### ❌ MongoDB Connection Failed

**Error:** `MongoDB: Connection failed`

**Solutions:**
1. Check your MongoDB connection string format
2. Make sure your password doesn't contain special characters (or URL encode them)
3. Verify your IP address is whitelisted in MongoDB Atlas
4. Ensure the database name is included in the connection string

### ❌ CORS Errors

**Error:** `Cross-Origin Request Blocked`

**Solutions:**
1. Ensure the backend is running on port `4000`
2. Check that `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173`
3. Restart both frontend and backend servers

### ❌ Daily.co API Errors

**Error:** `Failed to create Daily room`

**Solutions:**
1. Check that your `DAILY_API_KEY` is correct
2. Ensure you have an active Daily.co account
3. Check your Daily.co account limits (free tier has limits)

### ❌ Port Already in Use

**Error:** `Port 4000 is already in use`

**Solutions:**
1. Stop any other processes using port 4000
2. Or change the `PORT` in your `.env` file to a different port (e.g., `4001`)

---

## Environment Variables Reference

### Server `.env` File

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | Yes | Port for backend server | `4000` |
| `CORS_ALLOWED_ORIGINS` | Yes | Allowed frontend origins | `http://localhost:5173,http://localhost:5174` |
| `DAILY_API_KEY` | Yes | Daily.co API key for video | `your_api_key_here` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/studybunny` |
| `REDIS_HOST` | No | Redis server host | `localhost` |
| `REDIS_PORT` | No | Redis server port | `6379` |
| `REDIS_DB` | No | Redis database number | `0` |

---

## Security Best Practices

⚠️ **NEVER commit your `.env` file to Git!**

- The `.env` file contains sensitive credentials
- It's already listed in `.gitignore`
- Share credentials securely with your team (encrypted messaging, password managers, etc.)
- Each team member should have their own `.env` file

---

## Need Help?

If you run into any issues:

1. Check that all dependencies are installed: `npm install`
2. Ensure all environment variables are set correctly
3. Check the server logs for specific error messages
4. Restart both frontend and backend servers
5. Ask your team lead or check the project documentation

---

## Quick Start Checklist

- [ ] Node.js and npm installed
- [ ] Repository cloned
- [ ] Server dependencies installed (`cd server && npm install`)
- [ ] Client dependencies installed (`cd client && npm install`)
- [ ] `.env` file created in `server` folder
- [ ] Daily.co API key added to `.env`
- [ ] MongoDB connection string added to `.env`
- [ ] Backend server running (`npm start` in server folder)
- [ ] Frontend running (`npm run dev` in client folder)
- [ ] Application accessible at http://localhost:5173

---

**Last Updated:** October 2025

For more detailed MongoDB setup instructions, see [`MONGODB_SETUP.md`](./MONGODB_SETUP.md)
