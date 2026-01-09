# 🌐 Smart Logistics - Network Access Setup

**Your Mac IP: `172.31.0.218`** ✅ **CONFIGURED**

---

## ✅ What Has Been Done

- [x] Updated `api.js` with your IP: **172.31.0.218**
- [x] HTTP connections → `http://172.31.0.218:8000`
- [x] WebSocket connections → `ws://172.31.0.218:8000`
- [x] Frontend file updated and ready to use

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start 3 Services on Your Mac

Open **3 separate Terminal windows** and run these commands:

**Terminal 1 - Backend Service:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
/Users/varshithreddy/connections/.venv/bin/python backend/logistics_backend.py
```

**Terminal 2 - Frontend Web Server:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
/Users/varshithreddy/connections/.venv/bin/python -m http.server 8080 --bind 0.0.0.0
```

**Terminal 3 - ML Service:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
/Users/varshithreddy/connections/.venv/bin/python ml_service/main.py
```

Wait for all 3 to show "running" messages.

### Step 2: Open on Another Device

On your **laptop, phone, or tablet**:

1. Make sure it's on the **SAME WiFi** as your Mac
2. Open any web browser
3. Type in the address bar:
   ```
   http://172.31.0.218:8080
   ```
4. Press Enter
5. Wait 2-3 seconds for the page to load

### Step 3: Verify Connection

On the other device, open the browser console:

- **Mac:** Cmd + Option + J
- **Windows:** Ctrl + Shift + J
- **Android:** Chrome menu → Developer tools

Look for this message:

```
✅ [API] WebSocket connected - ready to receive emergency broadcasts
```

**If you see it, you're connected!** 🎉

---

## 🧪 Test Real-Time Notifications (2 Devices)

**Device 1 (Your Mac):**

1. Open: `http://localhost:8080`
2. Click "Go Online"
3. Click "Accept" when ride appears
4. Click "Report Issue"
5. Select "Vehicle Breakdown"
6. Click "Submit"

**Device 2 (Other Device):**

1. Open: `http://172.31.0.218:8080`
2. Click "Go Online"
3. **Watch for instant notification!** 🚨

---

## 📱 Supported Devices

✅ MacBook / iMac  
✅ Windows PC  
✅ iPhone / iPad  
✅ Android Phone / Tablet  
✅ Linux computer

(All must be on the same WiFi network)

---

## ❌ Troubleshooting

### "Cannot reach 172.31.0.218:8080"

- [ ] Are both devices on **same WiFi**?
- [ ] Is Mac connected to WiFi (not hotspot)?
- [ ] Are all 3 Terminal windows running?
- [ ] Refresh browser: Cmd+R or Ctrl+R

### "WebSocket connection failed"

- [ ] Verify api.js has `172.31.0.218` (not localhost)
- [ ] Check Terminal 1: Backend must be running
- [ ] Check for "[WEBSOCKET] Client connected" message in Terminal 1
- [ ] Refresh browser

### "Port already in use"

Stop all services:

```bash
pkill -f "logistics_backend|http.server|ml_service"
```

Then restart them.

### "IP changed - not working anymore"

Your IP may have changed. Find your new IP:

```bash
ifconfig | grep "inet "
```

Then update `api.js` lines 8-9 with the new IP.

---

## 💡 Commands Reference

| What       | Command                                                 |
| ---------- | ------------------------------------------------------- |
| Your IP    | `ifconfig \| grep "inet "`                              |
| Backend    | `python backend/logistics_backend.py`                   |
| Frontend   | `python -m http.server 8080 --bind 0.0.0.0`             |
| ML Service | `python ml_service/main.py`                             |
| Stop All   | `pkill -f "logistics_backend\|http.server\|ml_service"` |
| Access URL | `http://172.31.0.218:8080`                              |

---

## ✅ Success Checklist

Before testing:

- [ ] api.js updated with 172.31.0.218
- [ ] Terminal 1: Backend running
- [ ] Terminal 2: Frontend running
- [ ] Terminal 3: ML Service running
- [ ] Other device on same WiFi
- [ ] Can open http://172.31.0.218:8080
- [ ] See Smart Logistics UI
- [ ] Browser console shows WebSocket connected

---

## 🎉 You're Ready!

Your Smart Logistics system is now accessible from any device on your WiFi network.

**Start the 3 services and test it out!** 🚀
