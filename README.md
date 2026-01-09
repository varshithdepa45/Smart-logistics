# Smart Logistics - Dynamic Dispatch System

## 🚀 Overview

A full-stack logistics dispatch system with intelligent order reassignment powered by machine learning. Drivers can report delays/issues, and the backend uses ML risk scoring to automatically reassign orders to available drivers.

### Key Features

- ✅ **Live Frontend-Backend Integration** - Real HTTP API communication
- ✅ **Driver Management** - Registration, status tracking, availability
- ✅ **Order Management** - Creation, tracking, state management
- ✅ **Intelligent Reassignment** - ML-powered risk scoring (risk > 70% triggers reassignment)
- ✅ **Event Tracking** - Complete event history with idempotency
- ✅ **Mapbox Integration** - Real-time map, directions, geolocation
- ✅ **RESTful API** - Complete API documentation and endpoints
- ✅ **Docker Support** - Easy deployment with docker-compose

## 📋 Quick Start

### Option 1: Docker (Easiest)

```bash
# Clone/navigate to project
cd /Users/varshithreddy/connections/Smart-logistics

# Start all services
docker-compose up

# Open in browser
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

**Terminal 1 - Backend:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
pip install -r requirements.txt
python backend/logistics_backend.py
# Runs on http://localhost:8000
```

**Terminal 2 - Frontend:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python -m http.server 8080
# Open http://localhost:8080 in browser
```

**Terminal 3 - ML Service (Optional):**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
python ml_service/main.py
# Runs on http://localhost:8001
```

## 🎯 Main Feature: Intelligent Delay Handling

When a driver reports a delay:

1. **Frontend** sends delay event to backend with reason and priority
2. **Backend** validates the event and calls ML service
3. **ML Service** calculates risk score (0.0 to 1.0)
4. **Decision Gate**:
   - If risk > 70% → Automatically reassign to available driver
   - If risk ≤ 70% → Maintain current assignment, notify driver
5. **Frontend** shows decision and next steps to driver

### Example Request

```bash
curl -X POST http://localhost:8000/event/delay \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-001",
    "driver_id": "DRV-001",
    "reason": "Vehicle Breakdown",
    "event_id": "EVENT-001"
  }'
```

### Example Response

```json
{
  "status": "success",
  "event_id": "EVENT-001",
  "order_id": "ORD-001",
  "risk_score": 0.85,
  "action_taken": "REASSIGNMENT_INITIATED",
  "reassign_count": 1
}
```

## 📁 Project Structure

```
Smart-logistics/
├── index.html              # Frontend UI
├── script.js               # Frontend logic
├── api.js                  # API client library (NEW)
├── style.css               # Styling
├── backend/
│   ├── logistics_backend.py # Main backend API
│   └── README.md
├── ml_service/
│   ├── main.py            # ML service API
│   ├── train.py
│   └── data.csv
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.backend      # Backend container
├── Dockerfile.ml           # ML service container
├── requirements.txt        # Python dependencies
├── INTEGRATION_GUIDE.md    # Detailed integration docs
├── QUICK_START.md          # Quick start guide
└── INTEGRATION_COMPLETE.md # Completion status
```

## 🔌 API Endpoints

### Health & Status

- `GET /health` - Health check
- `GET /` - API documentation

### Drivers

- `GET /drivers` - List all drivers
- `POST /drivers` - Create driver
- `GET /drivers/{id}` - Get driver details

### Orders

- `GET /orders` - List all orders
- `POST /orders` - Create order
- `GET /orders/{id}` - Get order details

### Core Feature

- `POST /event/delay` - Report delay event (with ML risk scoring)

### System

- `GET /state` - Get complete system state
- `POST /reset` - Reset system (for testing)

## 📊 Architecture

```
┌─────────────────┐
│   Frontend      │ (Mapbox UI + script.js + api.js)
└────────┬────────┘
         │
      HTTP/REST
         │
┌────────▼────────────────────┐
│  Backend API (FastAPI)      │
│  ├─ Validation              │
│  ├─ State Management        │
│  └─ Decision Logic          │
└────────┬────────────────────┘
         │
      HTTP/REST
         │
    ┌────▼─────┐
    │ ML Service│ (Risk Scoring)
    └───────────┘
```

## 📚 Documentation

- **[INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)** - Full integration status and test guide
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Detailed integration documentation
- **[QUICK_START.md](QUICK_START.md)** - Quick setup and test workflow
- **[backend/README.md](backend/README.md)** - Backend API documentation

## 💻 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript, Mapbox GL
- **Backend**: FastAPI, Uvicorn, Pydantic
- **ML**: Python with risk scoring model
- **DevOps**: Docker, Docker Compose
- **Database**: In-memory state store (can be upgraded to PostgreSQL)

## 🧪 Testing

Run integration tests:

```bash
bash test_integration.sh
```

Or test manually:

```bash
# Health check
curl http://localhost:8000/health

# Get system state
curl http://localhost:8000/state

# Create test driver
curl -X POST http://localhost:8000/drivers \
  -H "Content-Type: application/json" \
  -d '{"id":"TEST-001","name":"Test Driver"}'

# Create test order
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{"id":"TEST-ORDER","assigned_driver_id":"TEST-001"}'

# Report delay (main feature)
curl -X POST http://localhost:8000/event/delay \
  -H "Content-Type: application/json" \
  -d '{
    "order_id":"TEST-ORDER",
    "driver_id":"TEST-001",
    "reason":"Traffic",
    "event_id":"TEST-EVENT"
  }'
```

## 🔍 Monitoring

### Browser Console

Look for `[API]` prefixed logs:

```javascript
[API] Backend health check passed
[API] Driver registered
[API] Order created
[API] Delay event processed
```

### Backend Console

Look for event logs:

```
[EVENT_RECEIVED] - Delay Event ID: EVENT-123456
[STATE_UPDATE] - Order marked as DELAYED
[DECISION] - Risk > Threshold. Initiating REASSIGNMENT.
[REASSIGNMENT_SUCCESS] - Order reassigned
```

## 🚨 Troubleshooting

| Issue                  | Solution                                                      |
| ---------------------- | ------------------------------------------------------------- |
| Backend won't start    | Run `pip install -r requirements.txt`                         |
| Port already in use    | Kill process: `lsof -ti:8000 \| xargs kill -9`                |
| Frontend can't connect | Check backend is running: `curl http://localhost:8000/health` |
| ML service not working | ML is optional - system works without it                      |

## 📦 Requirements

- Python 3.8+
- pip or pip3
- Modern web browser
- Optional: Docker and Docker Compose

## 🎓 Learning Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Mapbox GL Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [RESTful API Design](https://restfulapi.net/)

## 📄 License

This project is part of a hackathon submission.

## 👥 Team

Smart Logistics Development Team

---

**Status**: ✅ **LIVE AND FULLY INTEGRATED**

Backend running at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`
Frontend ready to use!
