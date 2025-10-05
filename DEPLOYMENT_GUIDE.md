# 🚀 Deployment Guide - MongoDB Edition

## Overview

This guide covers deploying your StudyBunny app with MongoDB Atlas (cloud database) to various platforms.

## Prerequisites

✅ MongoDB Atlas account setup (see `MONGODB_SETUP.md`)  
✅ MongoDB connection string ready  
✅ Git repository pushed to GitHub  

---

## Best Deployment Platforms (FREE Tier)

### 1. **Render** (Recommended) ⭐
- ✅ Easy to use
- ✅ Free tier includes 750 hours/month
- ✅ Auto-deploy from GitHub
- ✅ Built-in SSL
- ⚠️ Spins down after inactivity (30 sec cold start)

### 2. **Railway**
- ✅ Very developer-friendly
- ✅ $5 free credit/month
- ✅ Fast deployment
- ✅ Great dashboard
- ⚠️ Limited free tier

### 3. **Fly.io**
- ✅ Generous free tier
- ✅ Global edge deployment
- ✅ Always on (no cold starts)
- ⚠️ More complex setup

---

## Deployment: Render (Recommended)

### Backend (Server)

1. **Go to**: https://render.com
2. **Sign up** with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure:
   ```
   Name: studybunny-server
   Environment: Node
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: server
   Build Command: npm install
   Start Command: npm start
   ```

6. **Environment Variables** - Click "Advanced" and add:
   ```
   PORT=4000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/studybunny?retryWrites=true&w=majority
   DAILY_API_KEY=your-daily-api-key
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   ```

7. Click **"Create Web Service"**
8. Wait 5-10 minutes for deployment
9. Copy your backend URL: `https://studybunny-server.onrender.com`

### Frontend (Client)

1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Configure:
   ```
   Name: studybunny-client
   Branch: main
   Root Directory: client
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Environment Variables**:
   ```
   VITE_API_URL=https://studybunny-server.onrender.com
   ```

5. Click **"Create Static Site"**
6. Get your frontend URL: `https://studybunny-client.onrender.com`

7. **Update Backend CORS**:
   - Go back to backend service
   - Update `CORS_ALLOWED_ORIGINS` to include your frontend URL
   - Redeploy

---

## Deployment: Railway

### Setup

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository

### Backend Service

1. Click **"Add Service"** → **"GitHub Repo"**
2. Select `server` directory
3. Configure:
   ```
   Start Command: npm start
   ```

4. **Variables** (click Variables tab):
   ```
   PORT=4000
   MONGODB_URI=mongodb+srv://...
   DAILY_API_KEY=...
   CORS_ALLOWED_ORIGINS=https://${{RAILWAY_STATIC_URL}}
   ```

5. Railway auto-deploys and gives you a URL

### Frontend Service

1. **Add Service** → **GitHub Repo**
2. Select `client` directory
3. **Variables**:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

4. Auto-deploys to Railway URL

---

## Deployment: Fly.io

### Install Fly CLI

```bash
# Windows (PowerShell)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

# macOS/Linux
curl -L https://fly.io/install.sh | sh
```

### Login

```bash
fly auth login
```

### Deploy Backend

```bash
cd server

# Initialize
fly launch --name studybunny-server

# Set secrets
fly secrets set MONGODB_URI="mongodb+srv://..."
fly secrets set DAILY_API_KEY="your-key"
fly secrets set CORS_ALLOWED_ORIGINS="https://studybunny-client.fly.dev"

# Deploy
fly deploy
```

### Deploy Frontend

```bash
cd client

# Build locally first
npm run build

# Initialize
fly launch --name studybunny-client

# Deploy
fly deploy
```

---

## Update API URL in Frontend

### For Vite (what you're using):

Create `client/.env.production`:

```env
VITE_API_URL=https://your-backend-url.com
```

Update `client/src/components/Whiteboard.tsx`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const response = await fetch(`${API_URL}/api/whiteboards/save`, {
  // ...
});
```

Update `client/src/pages/SavedWhiteboard.tsx`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const response = await fetch(`${API_URL}/api/whiteboards/${id}`);
```

---

## Environment Variables Checklist

### Backend Required:
- ✅ `MONGODB_URI` - MongoDB Atlas connection string
- ✅ `CORS_ALLOWED_ORIGINS` - Frontend URL(s)
- ⚠️ `DAILY_API_KEY` - For video meetings (optional)
- ⚠️ `PORT` - Usually auto-set by platform

### Frontend Required:
- ✅ `VITE_API_URL` - Backend API URL

---

## Testing Deployment

### 1. Test Backend
```bash
curl https://your-backend-url.com/
# Should return: {"status":"ok","time":...}
```

### 2. Test MongoDB Connection
Check logs for:
```
✅ MongoDB: Connected successfully
```

### 3. Test Whiteboard Save
- Visit your frontend URL
- Join a room
- Draw on whiteboard
- Click "Save Whiteboard"
- Should get shareable link!

---

## Common Issues & Fixes

### Issue: CORS Error
**Symptom:** `Access to fetch blocked by CORS policy`

**Fix:**
```env
# Backend .env
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com,https://www.your-domain.com
```

### Issue: MongoDB Connection Failed
**Symptom:** `MongoServerError: bad auth`

**Fix:**
1. Check MongoDB Atlas → Network Access
2. Add `0.0.0.0/0` (allow all IPs)
3. Verify connection string in environment variables
4. Check username/password have no typos

### Issue: Whiteboard Not Saving
**Symptom:** 503 error or "Database not available"

**Fix:**
1. Check backend logs for MongoDB connection
2. Verify `MONGODB_URI` environment variable is set
3. Test connection with MongoDB Compass

### Issue: Cold Starts (Render)
**Symptom:** First request takes 30+ seconds

**Solutions:**
- Upgrade to paid plan ($7/month) for always-on
- Use UptimeRobot to ping every 5 mins (keeps awake)
- Accept it for free tier 🤷

---

## MongoDB Atlas IP Whitelist (Production)

### Get Your Deployment IPs:

**Render:**
- Not fixed - use `0.0.0.0/0` or upgrade to paid

**Railway:**
- Settings → Networking → Outbound IPs
- Add each IP to MongoDB whitelist

**Fly.io:**
```bash
fly ips list
```
- Add IPv4 addresses to MongoDB

---

## Performance Tips

### 1. Enable Compression
Already configured in your app with `helmet()`

### 2. Add Database Indexes
Already done in `Whiteboard` model:
```javascript
whiteboardSchema.index({ whiteboardId: 1 });
whiteboardSchema.index({ createdAt: -1 });
```

### 3. Monitor Performance
- MongoDB Atlas → Metrics
- Check query performance
- Set up alerts for slow queries

### 4. Caching (Optional)
Add Redis for frequently accessed whiteboards:
```javascript
// Check cache first, then database
```

---

## Cost Breakdown

### Free Tier:
| Service | Free Tier | Limits |
|---------|-----------|--------|
| MongoDB Atlas | FREE Forever | 512MB storage |
| Render | FREE | 750 hrs/month, cold starts |
| Railway | $5 credit/month | ~6-7 days runtime |
| Fly.io | FREE | 3 shared-cpu VMs |
| Daily.co | FREE | 10K minutes/month |

**Total Cost: $0/month** (with limitations)

### Recommended Paid Upgrade:
- Render Web Service: $7/month (no cold starts)
- MongoDB Atlas M10: $0.08/hour (~$57/month) for better performance
- **Total: ~$7-64/month** depending on needs

---

## Monitoring & Alerts

### MongoDB Atlas Alerts:
1. Database → Alerts
2. Set up:
   - Connection failures
   - High memory usage
   - Slow queries

### Deployment Platform:
- Check logs regularly
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor error rates

---

## Backup Strategy

### MongoDB Atlas (FREE):
✅ Automated daily backups (retained 2 days)
✅ Point-in-time restore (M10+ only)

### Manual Backup:
```bash
# Export all whiteboards
curl https://your-backend.com/api/whiteboards > backup.json
```

---

## Domain Setup (Optional)

### Custom Domain:

1. **Buy domain** (Namecheap, Google Domains, etc.)

2. **Add to Render/Railway/Fly:**
   - Settings → Custom Domain
   - Add: `studybunny.com`

3. **DNS Records:**
   ```
   Type: CNAME
   Name: @
   Value: your-app.onrender.com
   ```

4. **SSL:** Auto-configured by platform ✅

---

## Scaling Considerations

### When to Scale:

- 💯 More than 100 concurrent users
- 📈 Database size > 400MB
- 🐌 Response times > 1 second
- 🔥 CPU/memory consistently high

### Scaling Options:

1. **Horizontal:** Add more server instances (Render/Railway paid)
2. **Database:** Upgrade to MongoDB Atlas M10+
3. **CDN:** Use Cloudflare for static assets
4. **Caching:** Add Redis for hot data

---

## Security Checklist

✅ Environment variables (never in code)  
✅ HTTPS enabled (automatic on platforms)  
✅ MongoDB Atlas IP whitelist  
✅ Strong database passwords  
✅ Rate limiting (add `express-rate-limit`)  
✅ Input validation  
✅ CORS configured properly  
✅ Helmet.js security headers (already added)  

---

## Next Steps After Deployment

1. ✅ Test all features (rooms, chat, whiteboard, video)
2. ✅ Share link with friends
3. ✅ Monitor MongoDB Atlas dashboard
4. ✅ Set up error tracking (Sentry, optional)
5. ✅ Add custom domain (optional)
6. ✅ Implement analytics (optional)

---

## Quick Deploy Commands

```bash
# Install dependencies
cd server && npm install mongoose

# Update .env with MongoDB URI
echo "MONGODB_URI=mongodb+srv://..." >> server/.env

# Test locally
npm run dev

# Push to GitHub
git add .
git commit -m "Add MongoDB persistence"
git push

# Deploy on Render (auto-deploys from GitHub)
# Or use Railway/Fly.io CLI
```

---

## Support Resources

- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Render:** https://render.com/docs
- **Railway:** https://docs.railway.app/
- **Fly.io:** https://fly.io/docs/

**You're ready to deploy!** 🚀
