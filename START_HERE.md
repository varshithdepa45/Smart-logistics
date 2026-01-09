# 🎬 FINAL: EXACTLY WHAT TO DO TO RUN YOUR SYSTEM

## Step 1️⃣: Open Terminal and Go to Project

```bash
cd /Users/varshithreddy/connections/Smart-logistics
```

## Step 2️⃣: Pick ONE Way to Start (Choose Your Favorite)

### 🐳 METHOD A: Docker (Recommended - Easiest)

```bash
docker-compose up
```

**Then open browser:**

```
http://localhost
```

**That's it!** All services start automatically.

---

### 🔨 METHOD B: Manual (Full Control)

**Terminal 1 - Backend:**

```bash
python backend/logistics_backend.py
```

Wait until you see:

```
INFO: Application startup complete.
INFO: Uvicorn running on http://127.0.0.1:8000
```

**Terminal 2 - Frontend:**

```bash
python -m http.server 8080
```

**Then open browser:**

```
http://localhost:8080
```

**Terminal 3 (Optional) - ML Service:**

```bash
python ml_service/main.py
```

---

### 📋 METHOD C: Interactive Script

```bash
./start.sh
```

Follow the interactive menu to select what to start.

---

## Step 3️⃣: Use the Application

When the browser opens, you'll see the Smart Logistics interface.

### The 5-Minute Test Flow:

1. **Click "Go Online"** ← Driver goes online
   - Notification: "You are now online"
2. **Wait 3 seconds** ← Ride request appears
   - A ride request shows up
3. **Click "Accept Ride"** ← Ride becomes active
   - Map shows the route
4. **Click "Report Issue"** ← Main feature test!
   - Select a reason (e.g., "Vehicle Breakdown")
   - Choose priority (Low/Medium/High)
5. **Click "Submit Request"** ← Watch the magic!
   - Backend receives your report
   - ML calculates risk score (0-100%)
   - System decides: Reassign or Maintain?
   - Result shows instantly with:
     - Risk Score
     - Decision taken
     - Any reassignment notifications

---

## 🔍 How to Verify It's Working

### Check 1: Backend Health

```bash
curl http://localhost:8000/health
```

Should return something like:

```json
{"status":"healthy","drivers_count":3,"orders_count":2,...}
```

### Check 2: Browser Console

Press `F12` → Go to Console tab

Look for messages like:

```
[API] Backend health check passed
[API] Driver registered
[API] Delay event processed
```

### Check 3: Backend Terminal

In the terminal running the backend, look for:

```
[EVENT_RECEIVED] - Delay Event ID: EVENT-123456
[STATE_UPDATE] - Order marked as DELAYED
[DECISION] - Risk 0.85 > Threshold 0.7. Initiating REASSIGNMENT.
[REASSIGNMENT_SUCCESS] - Order reassigned
```

---

## 📚 Need More Information?

| Want to Know             | Read This File          |
| ------------------------ | ----------------------- |
| **How to run in detail** | `HOW_TO_RUN.md`         |
| **What's available**     | `COMPLETE_REFERENCE.md` |
| **Technical details**    | `INTEGRATION_GUIDE.md`  |
| **API functions**        | `api.js` (source code)  |
| **Quick reference**      | `QUICK_START.md`        |

---

## 🚨 Common Issues & Quick Fixes

### ❌ "Port 8000 already in use"

```bash
# Kill the process using port 8000
lsof -ti:8000 | xargs kill -9
```

### ❌ "Python not found"

Use the full path:

```bash
/Users/varshithreddy/connections/.venv/bin/python backend/logistics_backend.py
```

### ❌ "Module not found (fastapi, uvicorn, etc)"

```bash
pip install -r requirements.txt
```

### ❌ "Frontend page is blank"

1. Press F12 to open browser console
2. Check for error messages
3. Make sure backend is running

### ❌ "Backend won't start"

1. Make sure port 8000 is available
2. Check if Python 3.8+ is installed
3. Run: `pip install -r requirements.txt`

---

## ✅ Success Indicators

After starting, you should see:

- [ ] Backend logs show "Application startup complete"
- [ ] Frontend loads in browser (not blank)
- [ ] "Go Online" button is clickable
- [ ] After 3 seconds, a ride request appears
- [ ] Can click "Accept Ride"
- [ ] Can click "Report Issue"
- [ ] Risk score is calculated and shown
- [ ] Browser console (F12) shows [API] messages

If all of these work ✓ = **YOU'RE FULLY INTEGRATED!** 🎉

---

## 🎯 What's Actually Happening (Behind The Scenes)

```
You click "Report Issue"
    ↓
Frontend sends request to backend
    ↓
Backend receives on /event/delay endpoint
    ↓
Backend validates your request
    ↓
Backend calls ML service for risk prediction
    ↓
ML returns risk score (e.g., 0.85 = 85%)
    ↓
Backend makes decision:
  • If risk > 70% → REASSIGN to new driver
  • If risk ≤ 70% → KEEP current driver
    ↓
Backend sends response back to frontend
    ↓
Frontend shows you the result
    ↓
You see notification of decision ✨
```

---

## 🎬 That's It!

You now have a **fully integrated Smart Logistics system** with:

✅ Frontend connected to Backend
✅ Backend connected to ML Service
✅ Real-time decision making
✅ Intelligent order reassignment
✅ Complete API documentation
✅ Comprehensive guides

**Pick one of the 3 startup methods above and start testing!**

---

## 📞 Quick Reference

| Command                               | What it does               |
| ------------------------------------- | -------------------------- |
| `docker-compose up`                   | Start everything (easiest) |
| `python backend/logistics_backend.py` | Start backend only         |
| `python -m http.server 8080`          | Start frontend only        |
| `./start.sh`                          | Interactive startup menu   |
| `curl http://localhost:8000/health`   | Check backend health       |
| `curl http://localhost:8000/docs`     | View API docs              |

---

## 🏁 Ready?

```bash
cd /Users/varshithreddy/connections/Smart-logistics

# Choose ONE:
docker-compose up                           # Docker way
# OR
python backend/logistics_backend.py         # Manual way - Terminal 1
python -m http.server 8080                  # Manual way - Terminal 2
# OR
./start.sh                                  # Interactive way
```

Then open your browser and start testing!

🚀 **Let's go!**
