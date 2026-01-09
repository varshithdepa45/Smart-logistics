# Frontend-Backend Integration Guide

## Overview

The Smart Logistics system now has complete frontend-backend integration with the following architecture:

```
┌─────────────────┐
│   Frontend      │ (index.html + script.js + api.js)
│   (Mapbox UI)   │
└────────┬────────┘
         │
    ┌────▼─────────────────────────┐
    │ API Client (api.js)           │
    │ - Health checks               │
    │ - Driver registration         │
    │ - Order management            │
    │ - Delay event reporting       │
    └────┬────────────────────────┬─┘
         │                        │
    ┌────▼──────────────────┐   │
    │  Backend API          │   │
    │  (logistics_backend.py)   │
    │  - POST /event/delay  │   │
    │  - GET /state         │   │
    │  - GET /drivers       │   │
    │  - POST /drivers      │   │
    │  - GET /orders        │   │
    │  - POST /orders       │   │
    └───┬──────────────────┘   │
        │                       │
   ┌────▼──────────────┐   ┌───▼──────────────┐
   │ ML Service        │   │ System State     │
   │ (Risk Scoring)    │   │ (In-Memory Store)│
   └───────────────────┘   └──────────────────┘
```

## Key Integration Points

### 1. **API Client (`api.js`)**

Located at: `/Smart-logistics/api.js`

Provides the following functions:

#### Health & Initialization

- `initializeAPIClient()` - Called on page load, checks backend health and registers driver
- `checkBackendHealth()` - Verifies backend is running at `http://localhost:8000`

#### Driver Management

- `registerOrUpdateDriver(status)` - Register driver or update status (AVAILABLE/BUSY)
- `fetchAllDrivers()` - Get all drivers in system
- `fetchDriver(driverId)` - Get specific driver details

#### Order Management

- `fetchAllOrders()` - Get all orders
- `fetchOrder(orderId)` - Get specific order
- `createOrder(orderId, assignedDriverId)` - Create new order (called when driver accepts ride)

#### Core Business Logic

- `reportDelayEvent(orderId, driverId, reason, priority)` - **MAIN FEATURE**
  - Posts delay event to backend
  - Triggers ML risk prediction
  - Backend automatically reassigns order if risk > 0.7
  - Returns: `{ status, event_id, risk_score, action_taken, reassign_count }`

#### System State

- `fetchSystemState()` - Get complete system state (drivers, orders, event history)

### 2. **Frontend Changes (`script.js`)**

#### DOMContentLoaded Event

```javascript
document.addEventListener("DOMContentLoaded", async function () {
  // Initialize API Client first
  await initializeAPIClient();

  // ... rest of initialization
});
```

#### Driver Online/Offline Toggle

- When driver clicks "Go Online/Offline", calls `registerOrUpdateDriver('AVAILABLE')`
- Driver profile is synced with backend

#### Accept Ride

- When driver accepts a ride, `acceptRide()` now creates order in backend via `createOrder()`
- Order tracked in backend system

#### Emergency/Reassignment Request

- When driver reports delay/emergency, `submitEmergencyRequest()` now calls `reportDelayEvent()`
- Backend:
  1. Validates event
  2. Calls ML service for risk prediction
  3. If risk > 0.7: Reassigns order to available driver
  4. If risk ≤ 0.7: Maintains current assignment with notification
  5. Returns action taken and risk score

### 3. **Backend Endpoints**

Base URL: `http://localhost:8000`

#### Health & Status

- `GET /health` - Liveness probe
- `GET /` - API documentation

#### Driver Operations

- `GET /drivers` - List all drivers
- `POST /drivers` - Create new driver
- `GET /drivers/{driver_id}` - Get driver details

#### Order Operations

- `GET /orders` - List all orders
- `POST /orders` - Create new order
- `GET /orders/{order_id}` - Get order details

#### Core Business Logic

- `POST /event/delay` - **Report delay event** (triggers intelligent reassignment)
  ```json
  {
    "order_id": "RIDE-123456",
    "driver_id": "DRIVER-001",
    "reason": "Vehicle Breakdown",
    "event_id": "EVENT-123456"
  }
  ```

#### System Management

- `GET /state` - Get complete system snapshot
- `POST /reset` - Reset all state (for testing)

## Data Flow Examples

### Example 1: Driver Goes Online

```
User clicks "Go Online"
    ↓
toggleOnlineStatus() called
    ↓
registerOrUpdateDriver('AVAILABLE') called
    ↓
POST http://localhost:8000/drivers
    {
      "id": "DRIVER-123456",
      "name": "You",
      "status": "AVAILABLE"
    }
    ↓
Backend stores driver in system
    ↓
Frontend shows notification "Backend Connected"
```

### Example 2: Driver Accepts Ride

```
Frontend simulates ride request
    ↓
User clicks "Accept Ride"
    ↓
acceptRide() called
    ↓
createOrder() called
    ↓
POST http://localhost:8000/orders
    {
      "id": "RIDE-123456",
      "status": "ACTIVE",
      "assigned_driver_id": "DRIVER-123456"
    }
    ↓
Backend marks driver as BUSY
    ↓
Ride shown in UI, navigation active
```

### Example 3: Driver Reports Delay (MAIN FEATURE)

```
Driver encounters issue during ride
    ↓
User clicks "Report Issue" button
    ↓
Selects reason (e.g., "Vehicle Breakdown")
    ↓
submitEmergencyRequest() called
    ↓
reportDelayEvent() called with:
  - orderId: Current ride ID
  - driverId: Driver's ID
  - reason: Selected reason
  - priority: Selected priority level
    ↓
POST http://localhost:8000/event/delay
    {
      "order_id": "RIDE-123456",
      "driver_id": "DRIVER-123456",
      "reason": "Vehicle Breakdown",
      "event_id": "EVENT-789012"
    }
    ↓
┌─────────────────── BACKEND LOGIC ──────────────────┐
│                                                     │
│ 1. Validate order and driver exist                 │
│ 2. Call ML service: predict_delay_risk()           │
│ 3. Get risk score (0.0 to 1.0)                     │
│ 4. Decision Gate:                                  │
│    if risk_score > 0.7:                            │
│      - Find available driver                       │
│      - Reassign order                              │
│      - action_taken = "REASSIGNMENT_INITIATED"     │
│    else:                                           │
│      - Maintain assignment                         │
│      - action_taken = "MAINTAIN_ASSIGNMENT"        │
│ 5. Return response with decision and risk score    │
│                                                     │
└────────────────────────────────────────────────────┘
    ↓
Response:
    {
      "status": "success",
      "event_id": "EVENT-789012",
      "order_id": "RIDE-123456",
      "risk_score": 0.85,
      "action_taken": "REASSIGNMENT_INITIATED",
      "reassign_count": 1
    }
    ↓
Frontend receives and displays:
  - Risk score (85%)
  - Action taken
  - Shows reassignment in progress or maintains assignment
  - Notification sent to driver
```

## Setup Instructions

### 1. Start Backend

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python backend/logistics_backend.py
```

Backend runs at: `http://localhost:8000`

### 2. Start ML Service (Optional, Required for Full Features)

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python -m ml_service.main
```

ML Service runs at: `http://localhost:8001`

### 3. Start Frontend

Option A: Open `index.html` directly in browser
Option B: Use a local server

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python -m http.server 8080
# Open http://localhost:8080 in browser
```

### 4. Using Docker (Complete Stack)

```bash
cd /Users/varshithreddy/connections/Smart-logistics
docker-compose up
```

This starts:

- Backend at `http://localhost:8000`
- ML Service at `http://localhost:8001`
- Frontend accessible at `http://localhost` (via nginx)

## API Configuration

The frontend expects the backend at:

```javascript
const API_BASE_URL = "http://localhost:8000";
```

**Note:** If backend runs on different host/port, update `api.js`:

```javascript
const API_BASE_URL = "http://your-backend-host:port";
```

## Error Handling

If backend is unavailable:

1. Health check fails on page load
2. User sees notification: "Unable to connect to backend"
3. Frontend continues in **simulation mode**
4. All features work locally without real backend persistence
5. When backend comes back online, refresh page to reconnect

## Monitoring & Debugging

### Frontend Console

```javascript
// All API calls are logged
// Look for [API] prefixed messages
// Example: [API] Backend health check passed

// Check driver profile
console.log(driverProfile);

// Check system state
console.log(systemState);
```

### Backend Logs

```
[EVENT_RECEIVED] - Delay Event ID: EVENT-123456
[STATE_UPDATE] - Order RIDE-123456 marked as DELAYED
[DECISION] - Risk 0.85 > Threshold 0.7. Initiating REASSIGNMENT.
[REASSIGNMENT_SUCCESS] - Order reassigned to DRIVER-002
[EVENT_COMPLETE] - Event processed successfully
```

### API Endpoints for Testing

Health check:

```bash
curl http://localhost:8000/health
```

Get system state:

```bash
curl http://localhost:8000/state
```

List drivers:

```bash
curl http://localhost:8000/drivers
```

Create test order:

```bash
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TEST-001",
    "status": "ACTIVE",
    "assigned_driver_id": "DRIVER-001"
  }'
```

Report delay event:

```bash
curl -X POST http://localhost:8000/event/delay \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST-001",
    "driver_id": "DRIVER-001",
    "reason": "Traffic",
    "event_id": "EVENT-001"
  }'
```

## Features Implemented

✅ Driver registration on online toggle
✅ Order creation when ride accepted
✅ Delay event reporting with ML risk scoring
✅ Intelligent reassignment based on risk
✅ System state fetching
✅ Error handling and fallback modes
✅ Comprehensive logging
✅ Health checks

## Next Steps (Optional Enhancements)

- [ ] Real-time WebSocket updates
- [ ] User authentication
- [ ] Persistent database instead of in-memory
- [ ] Map integration with real coordinates
- [ ] Payment processing
- [ ] Analytics dashboard
- [ ] Driver rating system
- [ ] Customer communication system

## Support

For issues or questions:

1. Check browser console for [API] logs
2. Check backend console for [EVENT_RECEIVED] logs
3. Verify backend is running: `curl http://localhost:8000/health`
4. Verify ML service is running (optional): `curl http://localhost:8001/`
5. Check network tab for failed requests
