# Quick Start Guide - Smart Logistics Integration

## TL;DR - Get Running in 2 Minutes

### Prerequisites

- Python 3.8+
- A modern web browser
- Terminal/Command prompt

### Option 1: Using Docker (Easiest - Recommended)

```bash
# Navigate to project
cd /Users/varshithreddy/connections/Smart-logistics

# Start everything
docker-compose up

# Open in browser
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup (3 Commands)

**Terminal 1 - Start Backend:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python -m pip install -r requirements.txt
python backend/logistics_backend.py
# Wait until you see: "Starting Logistics Demo Backend..."
```

**Terminal 2 - Start Frontend:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python -m http.server 8080
# Open http://localhost:8080 in your browser
```

**Terminal 3 - Optional: Start ML Service:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python ml_service/main.py
```

## What Happens When You Open the App

1. **Page Loads** → `api.js` checks if backend is running
2. **Backend Found** → Driver profile registered automatically
3. **Ready to Use** → All features connected to backend

## Test the Integration in 60 Seconds

### Test 1: Go Online

1. Click "Go Online" button
2. Check browser console → Should see `[API] Driver registered`
3. Ride request appears after 3 seconds

### Test 2: Accept Ride

1. Ride request appears
2. Click "Accept Ride"
3. Check backend logs → Should see `[CREATE] - New order added`

### Test 3: Report Delay (THE MAIN FEATURE)

1. While ride is active, click "Report Issue"
2. Select a reason (e.g., "Vehicle Breakdown")
3. Choose priority level
4. Click "Submit Request"
5. Watch the backend magic:
   - ML service calculates risk score
   - Backend makes intelligent decision
   - You see the result instantly

### Expected Results

#### If Risk Score > 70%

- Backend initiates reassignment
- Shows "Looking for alternative drivers"
- Simulates driver assignment
- You get notification of reassignment

#### If Risk Score ≤ 70%

- Shows "Maintaining current assignment"
- Continues ride with current driver

## View Backend Status

### In Browser Console (F12)

```javascript
// See current driver profile
console.log(driverProfile);

// See all orders and drivers in system
console.log(systemState);

// See last API request
// Look for [API] prefixed messages
```

### In Terminal

Backend shows every action:

```
[EVENT_RECEIVED] - Delay Event ID: EVENT-123456
[STATE_UPDATE] - Order RIDE-123456 marked as DELAYED
[DECISION] - Risk 0.85 > Threshold 0.7. Initiating REASSIGNMENT.
[REASSIGNMENT_SUCCESS] - Order reassigned to DRIVER-002
```

## Troubleshooting

| Issue                          | Solution                                                   |
| ------------------------------ | ---------------------------------------------------------- |
| "Unable to connect to backend" | Make sure `python backend/logistics_backend.py` is running |
| Backend won't start            | Run `pip install -r requirements.txt` first                |
| Frontend blank page            | Check browser console (F12) for errors                     |
| Delay event fails              | Check backend terminal for validation errors               |
| ML service not working         | ML is optional - system works without it                   |

## API Endpoints Quick Reference

| Action           | Endpoint       | Method |
| ---------------- | -------------- | ------ |
| Check health     | `/health`      | GET    |
| Get all state    | `/state`       | GET    |
| Create driver    | `/drivers`     | POST   |
| Create order     | `/orders`      | POST   |
| **Report delay** | `/event/delay` | POST   |

## Architecture Overview

```
Your Browser
    ↓
   api.js (new file - handles all backend calls)
    ↓
http://localhost:8000 (Backend)
    ↓
Smart Decision Engine:
  ├─ Validates requests
  ├─ Calls ML service for risk scoring
  ├─ Makes intelligent reassignment decision
  └─ Returns result to frontend
```

## Key Files Modified

1. **`/api.js`** (NEW) - API client library
2. **`/index.html`** - Added `<script src="api.js"></script>`
3. **`/script.js`** - Updated 3 functions:
   - `DOMContentLoaded` - Initialize API client
   - `toggleOnlineStatus()` - Register driver with backend
   - `acceptRide()` - Create order in backend
   - `submitEmergencyRequest()` - Report delay to backend

## Example Workflow

```
1. Open app → Driver registered
2. Click "Go Online" → Backend tracks driver as AVAILABLE
3. Ride request → Click "Accept" → Order created in backend
4. During ride → Hit traffic → Click "Report Issue"
5. Select "Road Block" → Backend analyzes risk
6. Risk too high (>70%) → Backend finds alternative driver
7. Alternative driver assigned → You're notified
8. Continue receiving rides...
```

## Next Steps

- Read `INTEGRATION_GUIDE.md` for detailed documentation
- Check backend API docs: http://localhost:8000/docs
- Explore `api.js` to see all available functions
- Modify `reportDelayEvent()` call in `script.js` to add custom logic

## Questions?

- **Frontend Issue?** Check browser console (F12)
- **Backend Issue?** Check terminal where backend is running
- **API Issue?** Try curl command: `curl http://localhost:8000/health`
- **Need Full Docs?** Read `INTEGRATION_GUIDE.md`

---

**Status:** ✅ All frontend-backend connections are live and ready to use!
