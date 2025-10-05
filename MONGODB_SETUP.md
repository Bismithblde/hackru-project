# 🚀 MongoDB Atlas Setup Guide

## Why MongoDB Atlas?

✅ **FREE Forever Tier** (512MB storage)  
✅ **Fully Managed** - No server maintenance  
✅ **Cloud Hosted** - Works with any deployment platform  
✅ **Built-in Backups** - Automatic daily backups  
✅ **High Availability** - 99.995% uptime SLA  
✅ **Global** - Deploy close to your users

---

## Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with:
   - Email
   - Google
   - GitHub
3. Click "Sign Up" (no credit card required!)

---

## Step 2: Create a Free Cluster

1. After logging in, click **"Build a Database"**

2. Choose **M0 FREE** tier:

   - Storage: 512 MB
   - RAM: Shared
   - Disk: Shared
   - Cost: **FREE FOREVER**

3. Select cloud provider and region:

   - Provider: **AWS** (recommended)
   - Region: Choose closest to you (e.g., `us-east-1` for US East Coast)
   - Click **"Create"**

4. Name your cluster (optional): `hackru-project` or `studybunny`

5. Click **"Create Cluster"** (takes 3-5 minutes to provision)

---

## Step 3: Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter credentials:
   - Username: `studybunny-admin` (or any name)
   - Password: Click **"Autogenerate Secure Password"** (or create your own)
   - **COPY THE PASSWORD - YOU'LL NEED IT!**
5. Database User Privileges: Choose **"Read and write to any database"**
6. Click **"Add User"**

---

## Step 4: Allow Network Access

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, restrict to your deployment platform's IPs
4. Click **"Confirm"**

---

## Step 5: Get Connection String

1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select:
   - Driver: **Node.js**
   - Version: **5.5 or later**
5. Copy the connection string:

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. Replace placeholders:

   - `<username>` → your database username
   - `<password>` → your database password (from Step 3)

   Example:

   ```
   mongodb+srv://studybunny-admin:MySecurePass123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Step 6: Add to Your Project

### For Local Development:

1. Open `server/.env` file
2. Add this line:

   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/studybunny?retryWrites=true&w=majority
   ```

   **Note:** I added `/studybunny` before the `?` to specify the database name.

### Full Example `.env`:

```env
PORT=4000
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DAILY_API_KEY=your-daily-api-key
MONGODB_URI=mongodb+srv://studybunny-admin:MySecurePass123@cluster0.abc123.mongodb.net/studybunny?retryWrites=true&w=majority
```

---

## Step 7: Install MongoDB Package

```bash
cd server
npm install mongoose
```

---

## Step 8: Test the Connection

1. Start your server:

   ```bash
   npm run dev
   ```

2. Look for these logs:

   ```
   ✅ MongoDB: Connected successfully
   📦 MongoDB: Database - studybunny
   🌍 MongoDB: Host - cluster0.abc123.mongodb.net
   ```

3. If you see errors:
   - Check your connection string
   - Make sure password is correct (no special chars need URL encoding)
   - Verify IP whitelist includes your IP

---

## Step 9: Test Whiteboard Saving

1. Start your frontend:

   ```bash
   cd client
   npm run dev
   ```

2. Join a room and draw on the whiteboard
3. Click **"💾 Save Whiteboard"**
4. You should see: "Whiteboard saved! Link copied to clipboard"

5. Check MongoDB Atlas:
   - Go to **"Database"** → **"Browse Collections"**
   - You should see `studybunny` database with `whiteboards` collection
   - Click to view saved whiteboards!

---

## Deployment Setup (Heroku, Render, Railway, etc.)

### Environment Variable:

Add `MONGODB_URI` to your deployment platform:

**Heroku:**

```bash
heroku config:set MONGODB_URI="mongodb+srv://..."
```

**Render:**

- Dashboard → Environment Variables
- Key: `MONGODB_URI`
- Value: `mongodb+srv://...`

**Railway:**

- Project → Variables
- Add: `MONGODB_URI` = `mongodb+srv://...`

**Vercel (Serverless):**

- Settings → Environment Variables
- Name: `MONGODB_URI`
- Value: `mongodb+srv://...`

---

## Troubleshooting

### Error: "MongoServerError: bad auth"

- ✅ Check username/password are correct
- ✅ Make sure password doesn't have special characters (or URL encode them)
- ✅ Wait 1-2 minutes after creating user (propagation delay)

### Error: "connect ETIMEDOUT"

- ✅ Check IP whitelist in Network Access
- ✅ Try "Allow Access from Anywhere" (0.0.0.0/0)
- ✅ Check firewall isn't blocking MongoDB ports

### Error: "Authentication failed"

- ✅ Re-create database user
- ✅ Use autogenerated password
- ✅ Make sure user has "Read and write" permissions

### Connection string not working?

```javascript
// Test with this simple script:
const mongoose = require("mongoose");
mongoose
  .connect("your-connection-string")
  .then(() => console.log("Connected!"))
  .catch((err) => console.error("Error:", err));
```

---

## MongoDB Atlas Features You Get (FREE)

✅ **512 MB Storage** - Enough for thousands of whiteboards  
✅ **Shared CPU/RAM** - Fine for side projects  
✅ **100 connections** - More than enough  
✅ **Daily Backups** - Automatic backups retained for 2 days  
✅ **Metrics** - See database performance  
✅ **Alerts** - Get notified of issues  
✅ **Atlas Search** - Full-text search (if needed later)

---

## Security Best Practices

### Development:

- ✅ Use environment variables (never commit connection strings)
- ✅ Allow all IPs (0.0.0.0/0) for easy testing

### Production:

- ✅ Restrict IP access to your deployment platform
- ✅ Use strong passwords (autogenerated)
- ✅ Create separate users for different apps
- ✅ Enable MongoDB audit logs
- ✅ Set up monitoring/alerts

---

## Cost & Limits (M0 FREE Tier)

| Feature     | Limit   | Upgrade Needed?              |
| ----------- | ------- | ---------------------------- |
| Storage     | 512 MB  | ❌ Plenty for whiteboards    |
| Connections | 100     | ❌ More than enough          |
| RAM         | Shared  | ❌ Fine for this app         |
| CPU         | Shared  | ❌ Fine for this app         |
| Backups     | 2 days  | ⚠️ M10+ for longer retention |
| Regions     | Limited | ⚠️ M10+ for multi-region     |

**Estimate:** 512MB can store ~10,000+ whiteboards!

---

## What's Next?

Once MongoDB is connected:

✅ Whiteboards are saved to the cloud  
✅ Survives server restarts  
✅ Works with any deployment platform  
✅ Can scale horizontally  
✅ Automatic backups

### Future Enhancements:

- Add user authentication
- Track whiteboard ownership
- Add expiration (auto-delete old whiteboards)
- Add search/filtering
- Generate thumbnails
- Add collaborative editing history

---

## Quick Reference

```bash
# Install
npm install mongoose

# Environment variable
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Test connection
npm run dev

# View data
MongoDB Atlas → Database → Browse Collections
```

---

## Need Help?

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Mongoose Docs: https://mongoosejs.com/
- Community: https://community.mongodb.com/

**Your free tier never expires!** 🎉
