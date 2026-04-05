# 🚀 NexusLife — Complete Setup & Deployment Guide

## Project Structure
```
nexus-life/
├── server.js              ← Main Express server
├── package.json
├── .env.example           ← Copy to .env
├── .gitignore
├── models/
│   └── User.js            ← MongoDB user schema
├── middleware/
│   └── auth.js            ← Session auth middleware
├── routes/
│   ├── auth.js            ← Register / login / logout
│   ├── tasks.js           ← Task CRUD + toggle
│   └── game.js            ← Leaderboard + AI coach
└── public/
    ├── index.html         ← Full SPA frontend
    ├── css/style.css      ← All styles
    └── js/app.js          ← All frontend logic
```

---

## ✅ STEP 1 — Install Node.js
Download from: https://nodejs.org (choose LTS version)
Verify: `node -v` and `npm -v` in your terminal

---

## ✅ STEP 2 — Install dependencies
Open VS Code terminal in the nexus-life folder:
```bash
npm install
```

---

## ✅ STEP 3 — Get MongoDB Atlas (Free)
1. Go to https://mongodb.com/atlas
2. Create free account → Create free cluster (M0 Sandbox)
3. Create database user (remember username + password)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like):
   `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nexuslife`

---

## ✅ STEP 4 — Get Anthropic API Key
1. Go to https://console.anthropic.com
2. Create account → Go to API Keys
3. Create new key → copy it

---

## ✅ STEP 5 — Configure .env
```bash
cp .env.example .env
```
Open .env and fill in:
```
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/nexuslife
SESSION_SECRET=any_long_random_string_change_this
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3000
```

---

## ✅ STEP 6 — Run locally
```bash
npm run dev
```
Open: http://localhost:3000

To run without nodemon: `npm start`

---

## 🌐 DEPLOY LIVE — Render.com (FREE)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial NexusLife commit"
```
Create repo at github.com → follow instructions to push

### Step 2: Deploy on Render
1. Go to https://render.com → Sign up free
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: nexuslife
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables (in Render dashboard → Environment):
   - `MONGODB_URI` = your Atlas connection string
   - `SESSION_SECRET` = any long random string
   - `ANTHROPIC_API_KEY` = your key
   - `NODE_ENV` = production
6. Click "Create Web Service"
7. Wait ~3 minutes → your app is live!

### Step 3: MongoDB Atlas — Allow Render IP
In MongoDB Atlas → Network Access → Add IP Address
→ Click "Allow Access from Anywhere" (0.0.0.0/0) for simplicity

---

## 🌐 ALTERNATIVE: Railway.app
1. Go to https://railway.app → Login with GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Add same environment variables
4. Done — Railway auto-detects Node.js

---

## 🌐 ALTERNATIVE: Vercel (serverless — needs modification)
Not recommended for this setup since it uses sessions + MongoDB.
Use Render or Railway instead.

---

## 🔒 Production Tips
- Change SESSION_SECRET to a long random string
- Enable MongoDB Atlas IP allowlist properly
- Consider adding rate limiting: `npm install express-rate-limit`
- Add helmet for security headers: `npm install helmet`

---

## 🧪 Test the app locally
1. Register at /  (click "Create Your Character")
2. Complete onboarding (4 steps)
3. Mark tasks complete → XP updates
4. Check leaderboard (refreshes every 30s)
5. Chat with AI coach

---

## 📦 Add nodemon (for dev auto-restart)
Already in devDependencies. Run `npm run dev` instead of `npm start` locally.

---

## 🛠 Common Issues

**MongoDB connection fails:**
- Check your connection string in .env
- Make sure IP 0.0.0.0/0 is whitelisted in Atlas

**AI Coach says "unavailable":**
- Check your ANTHROPIC_API_KEY in .env
- Make sure you have API credits at console.anthropic.com

**Port already in use:**
- Change PORT=3001 in .env

**Sessions not persisting:**
- Make sure MONGODB_URI is correct (sessions are stored there)
