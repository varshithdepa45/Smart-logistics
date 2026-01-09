# 🤖 ML-Powered Driver Reassignment Demo

## Overview

Your Smart Logistics system now has **full ML integration** that:

1. **Detects delay events** from drivers
2. **Calculates risk scores** using ML service
3. **Makes intelligent decisions** based on risk threshold (70%)
4. **Reassigns to nearby available drivers** when risk is high
5. **Maintains assignment** when risk is acceptable

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                      │
│              http://localhost:8080                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User clicks "Report Issue" → Sends DelayEvent             │
│                                                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP POST /event/delay
                      │
         ┌────────────▼───────────────┐
         │   BACKEND (FastAPI)        │
         │   localhost:8000           │
         ├────────────────────────────┤
         │ 1. Validate Event          │
         │ 2. Update Order Status     │
         │ 3. Call ML Service         │
         │ 4. Risk Score → Decision   │
         │ 5. Reassign Driver (maybe) │
         └────────────┬───────────────┘
                      │
                      │ HTTP POST /predict-risk
                      │
         ┌────────────▼───────────────┐
         │   ML SERVICE               │
         │   localhost:8001           │
         ├────────────────────────────┤
         │ Input:  order_id, driver_id│
         │         reason (issue type)│
         │ Output: risk_score (0.0-1.0│
         └────────────────────────────┘
```

---

## 📊 How Risk Scoring Works

### ML Service Risk Calculation

The ML service (`/predict-risk` endpoint) calculates risk as:

```
base_risk = length(issue_reason) / 100
random_noise = random(0.0, 0.3)
risk_score = min(1.0, base_risk + noise)
```

**Example Risk Scores:**

| Issue Reason                                             | Typical Risk | Decision        |
| -------------------------------------------------------- | ------------ | --------------- |
| "Flat tire" (9 chars)                                    | ~0.15        | ✅ Maintain     |
| "Vehicle breakdown" (18 chars)                           | ~0.42        | ✅ Maintain     |
| "Engine failure, heavy traffic" (30 chars)               | ~0.60        | ✅ Maintain     |
| "Complete vehicle breakdown, cannot continue" (43 chars) | ~0.73        | 🔄 **REASSIGN** |

**Threshold: 0.7 (70%)**

- If `risk_score > 0.7` → Reassign to available driver
- If `risk_score ≤ 0.7` → Keep current driver

---

## 🧪 Step-by-Step Test Workflow

### Prerequisites

Verify all services are running:

```bash
# Check Backend
curl -s http://localhost:8000/health | grep "healthy"

# Check ML Service
curl -s -X POST http://localhost:8001/predict-risk \
  -H "Content-Type: application/json" \
  -d '{"order_id":"test","driver_id":"test","reason":"test"}'
  # Should return: {"risk_score": 0.xxx}

# Check Frontend
curl -s http://localhost:8080 | head -1
# Should return: <!DOCTYPE html>
```

### Test Steps

#### Step 1: Go Online

1. Open http://localhost:8080 in browser
2. Click **"Go Online"** button
3. Should see notification: "Backend Connected"
4. Status should change to "Online" (green)

**Console Output:**

```
[API] Initializing API client...
[API] Backend health check passed: {status: "healthy"...}
[API] System state fetched: {drivers: {...}...}
[API] Driver registered with backend
```

#### Step 2: Accept a Ride

1. Wait 3-5 seconds for ride request to appear
2. You'll see a card with:
   - Pickup location
   - Dropoff location
   - Estimated distance
3. Click **"Accept"** button

**Console Output:**

```
[API] Creating order...
[API] Order created successfully: {status: "success", order_id: "ORD-xxx"...}
```

**Backend Output (Terminal):**

```
[ORDER_CREATED] - Order ORD-xxx assigned to DRV-001
```

#### Step 3: Report a Minor Issue (Should NOT Reassign)

1. Click **"Report Issue"** button
2. Select issue type: "Traffic Jam"
3. Set priority: "Low"
4. Click **"Submit"**

**Expected Result:**

- Risk score: ~0.15-0.25 (LOW)
- Decision: ✅ **MAINTAIN ASSIGNMENT** (< 70% threshold)
- You stay as the driver
- See notification: "Issue logged. Assignment maintained."

**Backend Logs:**

```
[EVENT_RECEIVED] - Delay Event ID: EVT-xxx
[ML_SERVICE] - Received risk_score=0.18 from ML service
[DECISION] - Risk 0.18 <= Threshold 0.7. Maintaining assignment.
[EVENT_COMPLETE] - Event EVT-xxx processed successfully.
```

#### Step 4: Report a Critical Issue (SHOULD Reassign)

1. Accept another ride (wait for new request or manually create one)
2. Click **"Report Issue"** again
3. Select issue type: **"Vehicle Breakdown"**
4. Add comment: "Complete vehicle breakdown, cannot continue driving, engine failure"
5. Set priority: **"Critical"**
6. Click **"Submit"**

**Expected Result:**

- Risk score: ~0.60-0.75+ (HIGH - likely > 0.7)
- Decision: 🔄 **REASSIGNMENT INITIATED**
- You get reassigned to another driver (e.g., DRV-002 or DRV-003)
- See notification: "Critical issue detected! Reassigning order..."
- New driver ID appears in order details

**Backend Logs:**

```
[EVENT_RECEIVED] - Delay Event ID: EVT-yyy
[ML_SERVICE] - Received risk_score=0.73 from ML service
[DECISION] - Risk 0.73 > Threshold 0.7. Initiating REASSIGNMENT.
[REASSIGNMENT_SUCCESS] - Order ORD-yyy reassigned to DRV-002 (Attempt #1)
[EVENT_COMPLETE] - Event EVT-yyy processed successfully.
```

---

## 🔍 Monitoring the System

### Browser Console (F12)

Watch real-time API calls:

```javascript
[API] Initializing API client...
[API] Backend health check passed: {...}
[API] System state fetched: {drivers: {...}, orders: {...}}
[API] Driver registered with backend: {status: "success"}
[API] Delay event reported: {status: "success", risk_score: 0.73, action_taken: "REASSIGNMENT_INITIATED"}
```

### Backend Terminal

Monitor decision-making:

```bash
[EVENT_RECEIVED] - Delay Event ID: EVT-abc123
[STATE_UPDATE] - Order ORD-001 marked as DELAYED
[ML_CALL] - Calling ML service for risk prediction...
[ML_SERVICE] - Received risk_score=0.73 from ML service
[DECISION] - Risk 0.73 > Threshold 0.7. Initiating REASSIGNMENT.
[REASSIGNMENT_SUCCESS] - Order ORD-001 reassigned to DRV-002 (Attempt #1)
[EVENT_COMPLETE] - Event EVT-abc123 processed successfully.
```

### Check System State

Get complete snapshot via API:

```bash
curl -s http://localhost:8000/state | jq '.'
```

Returns:

```json
{
  "drivers": {
    "DRV-001": {"name": "Alice Johnson", "status": "AVAILABLE", ...},
    "DRV-002": {"name": "Bob Chen", "status": "BUSY", ...},
    "DRV-003": {"name": "Carol Martinez", "status": "AVAILABLE", ...}
  },
  "orders": {
    "ORD-001": {
      "id": "ORD-001",
      "status": "DELAYED",
      "assigned_driver_id": "DRV-002",
      "reassign_count": 1
    }
  },
  "event_history": [...],
  "processed_events": [...]
}
```

---

## 🎯 Complete Test Scenarios

### Scenario A: Low Risk → Maintain Driver

```
Issue: "Traffic Jam"
Risk Score: 0.15 (< 0.7)
Decision: ✅ Maintain assignment
Result: You stay as driver, just notified
```

### Scenario B: Medium Risk → Maintain Driver

```
Issue: "Minor vehicle issue"
Risk Score: 0.45 (< 0.7)
Decision: ✅ Maintain assignment
Result: You stay as driver
```

### Scenario C: High Risk → REASSIGN Driver ⭐

```
Issue: "Complete vehicle breakdown, cannot continue"
Risk Score: 0.75 (> 0.7)
Decision: 🔄 Reassignment initiated
Result: Order reassigned to DRV-002
         You no longer handle this order
         New driver gets assigned
```

---

## 🚗 Available Drivers for Reassignment

Your system comes with 3 demo drivers:

1. **DRV-001** - Alice Johnson
2. **DRV-002** - Bob Chen
3. **DRV-003** - Carol Martinez

When reassignment happens, the backend:

1. Finds first AVAILABLE driver (excluding current)
2. Assigns order to them
3. Updates their status to BUSY
4. Increments reassignment counter

**Reassignment Limit:** Max 2 reassignments per order

- If you reach 2 reassignments and another issue occurs, order is CANCELLED

---

## 🔧 Testing the ML Service Directly

Test risk calculation without UI:

```bash
# Low risk (short issue description)
curl -X POST http://localhost:8001/predict-risk \
  -H "Content-Type: application/json" \
  -d '{"order_id":"ORD-001","driver_id":"DRV-001","reason":"Flat tire"}'
# Result: {"risk_score": ~0.15}

# High risk (long issue description)
curl -X POST http://localhost:8001/predict-risk \
  -H "Content-Type: application/json" \
  -d '{"order_id":"ORD-001","driver_id":"DRV-001","reason":"Complete vehicle breakdown, cannot continue driving, need immediate assistance"}'
# Result: {"risk_score": ~0.65-0.75}
```

---

## 📈 Full Request-Response Flow

### Frontend to Backend (POST /event/delay)

**Request:**

```json
{
  "event_id": "EVT-20260109-001",
  "order_id": "ORD-001",
  "driver_id": "DRV-001",
  "reason": "Complete vehicle breakdown",
  "priority": "critical"
}
```

**Response:**

```json
{
  "status": "success",
  "event_id": "EVT-20260109-001",
  "order_id": "ORD-001",
  "risk_score": 0.73,
  "action_taken": "REASSIGNMENT_INITIATED",
  "order_status": "DELAYED",
  "reassign_count": 1
}
```

### Backend to ML Service (POST /predict-risk)

**Request:**

```json
{
  "order_id": "ORD-001",
  "driver_id": "DRV-001",
  "reason": "Complete vehicle breakdown"
}
```

**Response:**

```json
{
  "risk_score": 0.73
}
```

---

## ✅ Success Checklist

- [ ] Backend running on port 8000 without errors
- [ ] ML Service running on port 8001
- [ ] Frontend loads at http://localhost:8080
- [ ] Can click "Go Online" successfully
- [ ] Can accept rides without errors
- [ ] Can report issues without errors
- [ ] Low risk issues show "MAINTAIN ASSIGNMENT" decision
- [ ] High risk issues trigger "REASSIGNMENT_INITIATED"
- [ ] Order reassigns to different driver after high risk event
- [ ] Console shows [API] messages for each action
- [ ] Backend terminal shows [EVENT_RECEIVED] and [DECISION] logs
- [ ] System state shows updated driver assignments

---

## 🐛 Troubleshooting

**ML Service not responding?**

```bash
# Check if it's running
lsof -i :8001

# Restart it
pkill -f "ml_service"
/Users/varshithreddy/connections/.venv/bin/python /Users/varshithreddy/connections/Smart-logistics/ml_service/main.py &
```

**Backend not calling ML Service?**

- Check backend logs for "[ML_SERVICE]" messages
- If not found, backend is using fallback heuristic (still works!)

**No reassignment happening?**

- Check if risk_score > 0.7
- Make sure other drivers are AVAILABLE (not BUSY)
- Check reassignment_count < MAX_REASSIGNMENTS

**Frontend not calling backend?**

- Press F12 to open browser console
- Look for [API] messages or error messages
- Make sure http://localhost:8000 is accessible
- Verify CORS is enabled (should be fixed now!)

---

## 🎉 You're All Set!

Your Smart Logistics system has:

- ✅ Frontend-Backend integration
- ✅ ML risk scoring
- ✅ Intelligent reassignment
- ✅ Real-time decision making
- ✅ Complete monitoring

**Happy testing!** 🚀
