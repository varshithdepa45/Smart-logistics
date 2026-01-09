# 🚀 HOW TO RUN SMART LOGISTICS - COMPLETE GUIDE

## ⚡ Quick Start (2 Minutes)

### Option A: Using Docker (Easiest - Recommended)

```bash
cd /Users/varshithreddy/connections/Smart-logistics

docker-compose up
```

That's it! Everything starts automatically:

- Backend: http://localhost:8000
- Frontend: http://localhost (or http://localhost:80)
- ML Service: http://localhost:8001
- API Docs: http://localhost:8000/docs

---

### Option B: Manual Setup (3 Steps)

**Step 1: Open Terminal 1 - Start Backend**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python backend/logistics_backend.py
```

You should see:

```
🚀 Starting Logistics Demo Backend...
📍 Access at: http://localhost:8000
📚 API Docs: http://localhost:8000/docs

INFO: Application startup complete.
```

**Step 2: Open Terminal 2 - Start Frontend**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python -m http.server 8080
```

You should see:

```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/)
```

Then **open your browser** and go to:

```
http://localhost:8080
```

**Step 3 (Optional): Open Terminal 3 - Start ML Service**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python ml_service/main.py
```

You should see:

```
Uvicorn running on http://127.0.0.1:8001
```

---

## 📱 Using the App (What to Do After Opening)

### 1️⃣ Go Online

- Click the **"Go Online"** button in the sidebar
- You'll see: `Driver registered with backend` notification
- Status changes to "Online" (green indicator)

### 2️⃣ Accept a Ride

- A ride request appears after 3 seconds
- Click **"Accept Ride"** button
- You'll see order is created in backend
- Active ride panel shows with pickup/drop locations
- Map shows navigation route

### 3️⃣ Report a Delay (MAIN FEATURE - THE MAGIC!)

- While ride is active, click **"Report Issue"** button
- Select a reason:
  - Vehicle Breakdown
  - Health Issue
  - Family Emergency
  - Road Block/Traffic
  - Customer Issue
- Choose priority level (Low/Medium/High)
- Click **"Submit Request"**

**Then watch the magic happen:**

- ✅ Your request goes to backend
- ✅ ML service calculates risk score (0-100%)
- ✅ Backend makes intelligent decision:
  - **If Risk > 70%**: Order reassigned to another driver
  - **If Risk ≤ 70%**: Current driver continues (with notification)
- ✅ You see the result instantly with risk score

### 4️⃣ Check System Status

- Open browser console: `F12` or `Cmd+Option+I` on Mac
- Look for `[API]` prefixed messages
- See all backend calls logged

---

## 🧪 Testing the Integration

### Test Backend is Running

Open another terminal and run:

```bash
# Check backend health
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","timestamp":"2026-01-09T...","drivers_count":3,...}
```

### Test Main Feature (Delay Event)

```bash
# Report a delay event
curl -X POST http://localhost:8000/event/delay \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-001",
    "driver_id": "DRV-001",
    "reason": "Vehicle Breakdown",
    "event_id": "TEST-EVENT-001"
  }'

# Expected response shows:
# {
#   "status": "success",
#   "risk_score": 0.85,
#   "action_taken": "REASSIGNMENT_INITIATED",
#   "reassign_count": 1
# }
```

### View All API Endpoints

Open in browser:

```
http://localhost:8000/docs
```

This shows interactive API documentation!

---

## 📊 Checking Logs

### Frontend Logs (Browser Console)

Press `F12` to open Developer Tools → Console tab

Look for messages like:

```
[API] Backend health check passed
[API] Driver registered
[API] Delay event processed
```

### Backend Logs (Terminal)

Look in the backend terminal for:

```
[EVENT_RECEIVED] - Delay Event ID: EVENT-123456
[STATE_UPDATE] - Order RIDE-123456 marked as DELAYED
[DECISION] - Risk 0.85 > Threshold 0.7. Initiating REASSIGNMENT.
[REASSIGNMENT_SUCCESS] - Order reassigned to DRIVER-002
```

---

## 🆘 Troubleshooting

| Problem                     | Solution                                                      |
| --------------------------- | ------------------------------------------------------------- |
| "Cannot connect to backend" | Check backend is running: `curl http://localhost:8000/health` |
| Port 8000 in use            | Kill it: `lsof -ti:8000 \| xargs kill -9`                     |
| Python not found            | Use: `/Users/varshithreddy/connections/.venv/bin/python`      |
| Module not found            | Run: `pip install -r requirements.txt`                        |
| Frontend blank              | Check browser console (F12) for errors                        |

---

## 🎯 Complete Workflow (Full Test)

```
1. Start Backend (Terminal 1):
   python backend/logistics_backend.py

2. Start Frontend (Terminal 2):
   python -m http.server 8080

3. Open Browser:
   http://localhost:8080

4. Test Flow:
   ✓ Click "Go Online"
   ✓ Wait 3 seconds for ride request
   ✓ Click "Accept Ride"
   ✓ Click "Report Issue"
   ✓ Select reason and priority
   ✓ Click "Submit Request"
   ✓ Watch decision in real-time
   ✓ Check browser console for API logs
   ✓ Check backend terminal for processing logs

5. Results:
   ✓ Risk score calculated
   ✓ Reassignment decision made
   ✓ Frontend updates with result
   ✓ Notifications show action taken
```

---

## 📈 System Architecture

```
┌─────────────────────────────────┐
│     Browser (localhost:8080)    │
│  ┌───────────────────────────┐  │
│  │ index.html (Frontend UI)  │  │
│  │ ├─ Mapbox Map             │  │
│  │ ├─ Driver Controls        │  │
│  │ └─ Notifications          │  │
│  └────────────┬──────────────┘  │
│               │                  │
│  ┌────────────▼──────────────┐  │
│  │    api.js (API Client)    │  │
│  │ ├─ HTTP Calls             │  │
│  │ ├─ Error Handling         │  │
│  │ └─ Logging                │  │
│  └────────────┬──────────────┘  │
└───────────────┼──────────────────┘
                │
      ┌─────────▼──────────┐
      │  HTTP REST API     │
      │  localhost:8000    │
      └─────────┬──────────┘
                │
      ┌─────────▼──────────────┐
      │   Backend FastAPI      │
      │ ┌────────────────────┐ │
      │ │ State Store        │ │
      │ ├─ Drivers          │ │
      │ ├─ Orders           │ │
      │ └─ Events           │ │
      │ ┌────────────────────┐ │
      │ │ Business Logic     │ │
      │ ├─ Validation       │ │
      │ ├─ Decision Making  │ │
      │ └─ Reassignment     │ │
      │ ┌────────────────────┐ │
      │ │ ML Integration     │ │
      │ └─ Risk Scoring ────┬──┘
      │                     │
      │        ┌────────────▼────────┐
      │        │ ML Service (8001)   │
      │        │ ├─ Risk Prediction  │
      │        │ └─ Scoring Logic    │
      │        └────────────────────┘
      │
      └─────────────────────┘
```

---

## 📝 Key Files

| File                           | Purpose             | Status                            |
| ------------------------------ | ------------------- | --------------------------------- |
| `api.js`                       | Frontend API client | ✅ NEW - Created                  |
| `script.js`                    | Frontend logic      | ✅ UPDATED - 4 integration points |
| `index.html`                   | Frontend HTML       | ✅ UPDATED - Added api.js         |
| `backend/logistics_backend.py` | Backend API         | ✅ READY - No changes needed      |
| `ml_service/main.py`           | ML service          | ✅ READY - No changes needed      |

---

## 🔧 Advanced: Custom Configuration

### Change Backend URL

Edit `api.js` line 6:

```javascript
const API_BASE_URL = "http://localhost:8000"; // Change this
```

### Change Frontend Port

```bash
python -m http.server 8888  # Use port 8888 instead of 8080
```

### Change Backend Port

Edit `backend/logistics_backend.py` line 648:

```python
uvicorn.run(
    app,
    host="127.0.0.1",
    port=9000,  # Change this
    log_level="info"
)
```

---

## 🎉 SUCCESS CHECKLIST

After running, verify:

- [ ] Backend starts without errors
- [ ] `curl http://localhost:8000/health` returns 200
- [ ] Frontend loads in browser
- [ ] "Go Online" button works
- [ ] Ride requests appear
- [ ] Can accept rides
- [ ] Can report issues
- [ ] Risk score appears in response
- [ ] Browser console shows [API] logs
- [ ] Backend terminal shows [EVENT_RECEIVED] logs

---

## 📞 Quick Reference

```bash
# Kill all services
pkill -f "logistics_backend\|http.server\|ml_service"

# Kill specific port
lsof -ti:8000 | xargs kill -9

# Check if backend is running
curl http://localhost:8000/health

# View backend logs
tail -f /tmp/backend.log

# Full reset and start fresh
pkill -f "logistics_backend"
python backend/logistics_backend.py

# Start everything in background
nohup python backend/logistics_backend.py > backend.log 2>&1 &
nohup python -m http.server 8080 > frontend.log 2>&1 &
nohup python ml_service/main.py > ml.log 2>&1 &
```

---

## 🚀 YOU'RE ALL SET!

Everything is connected and ready to go. Just follow one of the startup options above and you'll be using the fully integrated Smart Logistics system!

**Need help?** Check the browser console (F12) and backend terminal for detailed logs.

**Want details?** Read `INTEGRATION_GUIDE.md` for comprehensive documentation.

Happy testing! 🎉
