# 🌐 Running Smart Logistics on Another Device

## Overview

You can run the Smart Logistics system on **any device** (laptop, desktop, phone) on the **same network**. Here's how!

---

## 📋 Prerequisites

### On the Device Running the Backend (Server)

- Python 3.8+
- Project files from GitHub
- Virtual environment with dependencies

### On the Device Accessing the Frontend (Client)

- **Any modern web browser** (Chrome, Firefox, Safari, Edge)
- **Same WiFi network** as the backend server
- **Port 8080 accessible** from client device

---

## 🚀 Step 1: Setup Backend Server (Main Device)

### A. Get the Project

**Option 1: Clone from GitHub**

```bash
cd /Users/varshithreddy/connections
git clone https://github.com/varshithdepa45/Smart-logistics.git
cd Smart-logistics
```

**Option 2: Copy Existing Project**

```bash
# Already have it at:
/Users/varshithreddy/connections/Smart-logistics
```

### B. Install Dependencies

```bash
# Activate virtual environment
source /Users/varshithreddy/connections/.venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### C. Find Your Device's IP Address

**On Mac:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for something like: `192.168.x.x` or `10.0.x.x`

**Example Output:**

```
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

**Note:** Use `192.168.1.100` (the IP address, not 127.0.0.1)

### D. Start All Three Services

**Terminal 1 - Backend (Listen on All Interfaces):**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
/Users/varshithreddy/connections/.venv/bin/python backend/logistics_backend.py
```

**Important:** The backend automatically listens on `0.0.0.0:8000` (all network interfaces), so it's accessible from other devices.

**Terminal 2 - Frontend (Listen on All Interfaces):**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
/Users/varshithreddy/connections/.venv/bin/python -m http.server 8080 --bind 0.0.0.0
```

**Terminal 3 - ML Service:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
/Users/varshithreddy/connections/.venv/bin/python ml_service/main.py
```

---

## 💻 Step 2: Configure Frontend for Network Access

### Update API Configuration

You need to tell the frontend where the backend is. Edit `api.js`:

**Find this line:**

```javascript
const API_BASE_URL = "http://localhost:8000";
const WS_BASE_URL = "ws://localhost:8000";
```

**Replace with your server IP:**

```javascript
const API_BASE_URL = "http://192.168.1.100:8000"; // Your actual IP
const WS_BASE_URL = "ws://192.168.1.100:8000"; // Your actual IP
```

**Example (if your IP is 192.168.1.100):**

```javascript
const API_BASE_URL = "http://192.168.1.100:8000";
const WS_BASE_URL = "ws://192.168.1.100:8000";
```

---

## 📱 Step 3: Access from Another Device

### From Client Device (Laptop, Phone, etc.)

**Open your browser and go to:**

```
http://192.168.1.100:8080
```

(Replace `192.168.1.100` with **your actual server IP**)

### What You Should See:

- ✅ Smart Logistics UI loads
- ✅ Map displays
- ✅ "Go Online" button works
- ✅ Can accept rides
- ✅ Can report issues

---

## 🎯 Testing Multi-User from Multiple Devices

### Setup:

1. **Device A (Your Mac):** Backend, Frontend, ML Service running
2. **Device B (Laptop):** Browser → `http://192.168.1.100:8080` (Driver #1)
3. **Device C (Phone/Tablet):** Browser → `http://192.168.1.100:8080` (Driver #2)
4. **Device D (Phone):** Browser → `http://192.168.1.100:8080` (Driver #3)

### Test Emergency Broadcasting:

1. Device B: Go Online → Accept Ride
2. Device B: Report Emergency
3. **All devices** see notification instantly via WebSocket!

---

## 🔧 Common Setup Issues & Fixes

### Issue: "Connection Refused" Error

**Cause:** Backend not listening on correct interface

**Fix:**

```bash
# Stop current backend
pkill -f logistics_backend

# Restart with explicit binding
/Users/varshithreddy/connections/.venv/bin/python backend/logistics_backend.py
```

Verify it's listening:

```bash
lsof -i :8000
```

Should show:

```
Python  12345 user   10u  IPv4 0x...    0t0  TCP *:8000 (LISTEN)
```

---

### Issue: "WebSocket Connection Failed"

**Cause:** Frontend still using `localhost` instead of server IP

**Fix:** Update `api.js` again:

```javascript
const API_BASE_URL = "http://192.168.1.100:8000";
const WS_BASE_URL = "ws://192.168.1.100:8000";
```

**Then refresh browser:**

- Client device: Press `Cmd+R` (Mac) or `Ctrl+R` (Windows)

---

### Issue: "Can't Connect to Backend" from Other Device

**Troubleshooting Checklist:**

1. ✓ Same WiFi network? (check both devices)
2. ✓ Correct IP address? (`ifconfig` to verify)
3. ✓ Backend running? (`curl http://192.168.1.100:8000/health`)
4. ✓ Frontend port 8080 accessible? (`curl http://192.168.1.100:8080`)
5. ✓ Firewall allowing ports 8000, 8080, 8001?
6. ✓ `api.js` has correct IP? (not `localhost`)

---

### Issue: "Port 8000/8080 Already in Use"

**Find and kill processes:**

```bash
# Kill backend
lsof -ti:8000 | xargs kill -9

# Kill frontend
lsof -ti:8080 | xargs kill -9

# Kill ML service
lsof -ti:8001 | xargs kill -9
```

Then restart.

---

## 📊 Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR LOCAL NETWORK                   │
│                   (Home/Office WiFi)                     │
│                                                         │
│  ┌─────────────────┐          ┌──────────────────────┐ │
│  │  Server Device  │          │  Client Device #1    │ │
│  │  (Your Mac)     │◄─────────│  (Laptop/Phone)      │ │
│  │                 │  WiFi    │  Browser             │ │
│  │ Backend:8000    │          │ 192.168.1.101        │ │
│  │ Frontend:8080   │          │                      │ │
│  │ ML Service:8001 │          │ Opens:               │ │
│  │                 │          │ http://192.168.1.100 │ │
│  │ IP: 192.168.1.1 │          │        :8080          │ │
│  └─────────────────┘          └──────────────────────┘ │
│         ▲                                                │
│         │                      ┌──────────────────────┐ │
│         └──────────────────────│  Client Device #2    │ │
│                                │  (Phone/Tablet)      │ │
│                                │ Browser              │ │
│                                │ 192.168.1.102        │ │
│                                │                      │ │
│                                │ Opens:               │ │
│                                │ http://192.168.1.100 │ │
│                                │        :8080          │ │
│                                └──────────────────────┘ │
│                                                         │
│                      ┌──────────────────────┐          │
│                      │  Client Device #3    │          │
│                      │  (Another Device)    │          │
│                      │ Browser              │          │
│                      │ 192.168.1.103        │          │
│                      │                      │          │
│                      │ Opens:               │          │
│                      │ http://192.168.1.100 │          │
│                      │        :8080          │          │
│                      └──────────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Complete Setup Checklist

### Server Device Setup

- [ ] Project cloned/copied
- [ ] Dependencies installed
- [ ] `api.js` updated with server IP
- [ ] Backend running on port 8000
- [ ] Frontend running on port 8080 (with `--bind 0.0.0.0`)
- [ ] ML Service running on port 8001
- [ ] Server IP noted (e.g., `192.168.1.100`)

### Client Device Setup

- [ ] Same WiFi network as server
- [ ] Browser open
- [ ] Navigated to `http://SERVER_IP:8080`
- [ ] UI loads correctly
- [ ] Can see map and driver profile

### Functionality Test

- [ ] Click "Go Online" works
- [ ] Ride requests appear
- [ ] Can accept rides
- [ ] Can report issues
- [ ] Console shows `[API] WebSocket connected`
- [ ] Multiple devices get real-time notifications

---

## 🌍 Accessing from Outside Network

### NOT Recommended (Security Risk):

Exposing your local backend to the internet is risky. But if you really need to:

**Option 1: Port Forwarding**

- Router → Port forwarding → Forward external port to `192.168.1.100:8000`
- Requires router access and port configuration
- ⚠️ Security risk

**Option 2: Ngrok Tunneling**

```bash
# Install ngrok
brew install ngrok

# Tunnel backend
ngrok http 8000

# Tunnel frontend
ngrok http 8080

# Get public URLs and use those
```

**Option 3: Cloud Deployment**

- Deploy to AWS, Azure, Heroku, etc.
- More secure and scalable
- Better for production

---

## 🚀 Quick Setup Command Cheatsheet

### On Server Device:

```bash
# Go to project
cd /Users/varshithreddy/connections/Smart-logistics

# Get your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Edit api.js with your IP
nano api.js
# Find: const API_BASE_URL = "http://localhost:8000";
# Replace with: const API_BASE_URL = "http://YOUR_IP:8000";

# Terminal 1: Backend
/Users/varshithreddy/connections/.venv/bin/python backend/logistics_backend.py

# Terminal 2: Frontend
/Users/varshithreddy/connections/.venv/bin/python -m http.server 8080 --bind 0.0.0.0

# Terminal 3: ML Service
/Users/varshithreddy/connections/.venv/bin/python ml_service/main.py
```

### On Client Device:

```
1. Open browser
2. Type: http://YOUR_SERVER_IP:8080
3. Press Enter
4. Enjoy! 🎉
```

---

## 📞 Troubleshooting Checklist

```bash
# Check if backend is running and accessible
curl http://192.168.1.100:8000/health

# Check if frontend is running and accessible
curl http://192.168.1.100:8080 | head

# Check if ML service is running
curl -X POST http://192.168.1.100:8001/predict-risk \
  -H "Content-Type: application/json" \
  -d '{"order_id":"test","driver_id":"test","reason":"test"}'

# Monitor backend logs in real-time
tail -f /tmp/backend.log | grep -i error

# Monitor all connections
lsof -i | grep LISTEN
```

---

## 🎯 Pro Tips

### Tip 1: Use a Script to Start All Services

```bash
#!/bin/bash
cd /Users/varshithreddy/connections/Smart-logistics

echo "Starting Backend..."
/Users/varshithreddy/connections/.venv/bin/python backend/logistics_backend.py &

echo "Starting Frontend..."
/Users/varshithreddy/connections/.venv/bin/python -m http.server 8080 --bind 0.0.0.0 &

echo "Starting ML Service..."
/Users/varshithreddy/connections/.venv/bin/python ml_service/main.py &

echo "All services started!"
sleep 2
echo "Access at: http://192.168.1.100:8080"
```

### Tip 2: Monitor in Real-Time

```bash
# Watch backend logs
watch -n 1 'tail -20 /tmp/backend.log'
```

### Tip 3: Reset for Clean Testing

```bash
# Kill all services
pkill -f "logistics_backend\|http.server\|ml_service"

# Wait a moment
sleep 2

# Start fresh
# (Use script or manual commands)
```

---

## 🎉 You're Ready!

Your Smart Logistics system can now be accessed from:

- ✅ Same device (localhost)
- ✅ Other devices on same network
- ✅ Multiple users simultaneously
- ✅ Any modern web browser

**Happy multi-device testing!** 🚀

---

**Version:** 1.0.0  
**Last Updated:** January 9, 2026  
**Status:** Ready for Network Deployment ✅
