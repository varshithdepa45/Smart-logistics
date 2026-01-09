# 📱 STEP-BY-STEP: How to Open on Other Devices

## The Goal

Run the backend on **your Mac** and access it from **another device** (laptop, phone, tablet) on the same WiFi.

---

## 🎯 SIMPLE 3-STEP PROCESS

### **STEP 1: Find Your Mac's Network IP Address**

**On your Mac, open Terminal and run:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**You'll see output like:**

```
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

**⭐ Copy this number: `192.168.1.100`** (your actual number will be different)

**This is your Server IP - remember it!**

---

### **STEP 2: Edit api.js - Tell Frontend Where Backend Is**

**On your Mac, open the file:**

```
/Users/varshithreddy/connections/Smart-logistics/api.js
```

**Find these 2 lines (around line 8-9):**

```javascript
const API_BASE_URL = "http://localhost:8000";
const WS_BASE_URL = "ws://localhost:8000";
```

**Replace `localhost` with YOUR IP address:**

```javascript
const API_BASE_URL = "http://192.168.1.100:8000";
const WS_BASE_URL = "ws://192.168.1.100:8000";
```

**⚠️ IMPORTANT:** Replace `192.168.1.100` with the IP you found in Step 1!

**Then save the file (Cmd+S)**

---

### **STEP 3: Start All Services on Your Mac**

**Open 3 Terminal windows/tabs on your Mac:**

**Terminal Window 1 - Backend:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
/Users/varshithreddy/connections/.venv/bin/python backend/logistics_backend.py
```

**Terminal Window 2 - Frontend:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
/Users/varshithreddy/connections/.venv/bin/python -m http.server 8080 --bind 0.0.0.0
```

**Terminal Window 3 - ML Service:**

```bash
cd /Users/varshithreddy/connections/Smart-logistics
/Users/varshithreddy/connections/.venv/bin/python ml_service/main.py
```

**All 3 should start without errors.**

---

## 🌐 OPEN ON ANOTHER DEVICE

### **On Your Other Device (Laptop, Phone, Tablet):**

**1. Make sure it's on the SAME WiFi as your Mac**

**2. Open a web browser**

**3. In the address bar, type:**

```
http://192.168.1.100:8080
```

(Use YOUR IP from Step 1, not this example!)

**4. Press Enter**

---

## ✅ What You Should See

**If everything works:**

- ✅ The Smart Logistics UI loads
- ✅ You see a map
- ✅ You see "Go Online" button
- ✅ You see driver profile

**If it doesn't work:**

- ❌ See "Connection Refused" → Check IP is correct
- ❌ See blank page → Refresh browser (Cmd+R or Ctrl+R)
- ❌ See loading spinner → Wait 5 seconds

---

## 🧪 QUICK VERIFICATION

### **Check Everything is Working**

**On the other device, open browser console:**

- **Mac:** Press `Cmd + Option + J`
- **Windows:** Press `Ctrl + Shift + J`
- **Phone/Tablet:** Developer tools (varies by browser)

**Look for this message:**

```
[API] WebSocket connected - ready to receive emergency broadcasts
```

If you see this, **you're connected!** ✅

---

## 🚗 TEST MULTI-DEVICE EMERGENCY

### **Now Test with Multiple Devices:**

**Device 1 (Your Mac Browser):**

1. Open: `http://localhost:8080`
2. Click "Go Online"
3. Wait for ride request
4. Click "Accept"

**Device 2 (Laptop/Phone):**

1. Open: `http://192.168.1.100:8080`
2. Click "Go Online"
3. Wait for ride request
4. Click "Accept"

**Device 1 - Report Emergency:**

1. Click "Report Issue"
2. Select "Vehicle Breakdown"
3. Add comment: "Complete vehicle breakdown"
4. Click "Submit"

**Watch Device 2:**

- 🚨 You'll see instant notification!
- If Device 2 is available, you'll see "Order Assigned to You!"

---

## ❌ TROUBLESHOOTING

### **Problem 1: "Can't connect to http://192.168.1.100:8080"**

**Checklist:**

```
1. ✓ Did you find the correct IP? (ifconfig)
2. ✓ Did you update api.js with that IP?
3. ✓ Is the other device on the same WiFi?
4. ✓ Did you save api.js after editing?
5. ✓ Did you refresh the browser on other device?
```

**Quick Fix:**

- On other device, try: `http://192.168.1.100:8000/health`
- If that loads, the backend is reachable
- If not, check your IP address is correct

---

### **Problem 2: "WebSocket connection failed"**

**You'll see in browser console:**

```
[API] WebSocket error
```

**Cause:** `api.js` still has `localhost` instead of your IP

**Fix:**

1. Edit `api.js` again
2. Check line 8-9 have your IP (not localhost)
3. Save file
4. Refresh browser on other device (Cmd+R)

---

### **Problem 3: "Port 8080 already in use"**

**You see error when starting frontend:**

```
Address already in use
```

**Fix:**

```bash
# Kill the process using port 8080
lsof -ti:8080 | xargs kill -9

# Then restart frontend
python -m http.server 8080 --bind 0.0.0.0
```

---

### **Problem 4: "Devices not syncing notifications"**

**You report emergency but other device doesn't see it**

**Checklist:**

```
1. ✓ Check backend terminal shows: [BROADCAST] - Emergency event...
2. ✓ Check other device console: [API] 🚨 Emergency event broadcast
3. ✓ Make sure WebSocket connected on both devices
4. ✓ Try reporting emergency again
```

---

## 📊 VISUAL GUIDE

```
YOUR MAC (Server)
┌─────────────────────────────┐
│ Terminal 1: Backend:8000    │
│ Terminal 2: Frontend:8080   │
│ Terminal 3: ML:8001         │
│                             │
│ IP: 192.168.1.100           │
└─────────────────────────────┘
            │
            │ WiFi Connection
            │
┌─────────────────────────────┐
│ OTHER DEVICE (Client)       │
│ Browser:                    │
│ http://192.168.1.100:8080   │
│                             │
│ Sees UI & notifications ✅  │
└─────────────────────────────┘
```

---

## ✅ COMPLETE CHECKLIST

Before opening on other device:

- [ ] Found Mac IP address (e.g., 192.168.1.100)
- [ ] Updated api.js with that IP
- [ ] Saved api.js file
- [ ] Backend running (Terminal 1 shows "Application startup complete")
- [ ] Frontend running (Terminal 2 shows "Serving HTTP on 0.0.0.0 port 8080")
- [ ] ML Service running (Terminal 3 shows "Starting ML Service")
- [ ] Other device is on same WiFi
- [ ] Browser on other device opens `http://YOUR_IP:8080`
- [ ] UI loads and shows map

---

## 🎯 QUICK REFERENCE TABLE

| Item          | Example                      | Your Value     |
| ------------- | ---------------------------- | -------------- |
| Your Mac IP   | `192.168.1.100`              | ******\_****** |
| Backend URL   | `http://192.168.1.100:8000`  | ******\_****** |
| Frontend URL  | `http://192.168.1.100:8080`  | ******\_****** |
| WebSocket URL | `ws://192.168.1.100:8000/ws` | ******\_****** |

---

## 🎓 KEY CONCEPTS

### **What is `localhost`?**

- Means "this computer"
- Only works on the same device
- Other devices can't see it

### **What is `192.168.1.100`?**

- Your Mac's real IP address on the network
- Other devices can see it
- Devices on same WiFi can connect to it

### **What is `0.0.0.0`?**

- Means "listen on all network interfaces"
- Used in `--bind 0.0.0.0` flag
- Makes services accessible from other devices

---

## 🚀 SUCCESS INDICATORS

**Everything is working if:**

✅ Other device browser loads: `http://192.168.1.100:8080`  
✅ You see the Smart Logistics UI  
✅ Browser console shows: `[API] WebSocket connected`  
✅ Backend terminal shows: `[WEBSOCKET] Client connected`  
✅ Can click "Go Online" on other device  
✅ Can accept rides on other device  
✅ When reporting emergency, other devices get notified

---

## 📱 SUPPORTED DEVICES

Works on:

- ✅ Another Mac
- ✅ Windows laptop
- ✅ iPhone/iPad (Safari)
- ✅ Android phone/tablet
- ✅ Any device with modern browser
- ✅ Any device on same WiFi

---

## 💡 TIPS & TRICKS

### **Tip 1: Find IP Quickly**

```bash
# Faster way to get just the IP
ipconfig getifaddr en0
# Output: 192.168.1.100
```

### **Tip 2: Test Backend is Reachable**

```bash
curl http://192.168.1.100:8000/health
# Should show: {"status":"healthy"...}
```

### **Tip 3: Monitor Connections**

In backend terminal, look for:

```
[WEBSOCKET] Client connected. Total connections: 2
```

### **Tip 4: Auto-Reload Browser**

If you change api.js:

1. Save file
2. Do hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

---

## 🎉 YOU'RE READY!

Now you can:

- ✅ Run backend on Mac
- ✅ Access from any device on WiFi
- ✅ Test with 2-3+ devices simultaneously
- ✅ See real-time notifications across devices
- ✅ Demonstrate multi-user features

**Enjoy!** 🚀

---

**Version:** 1.0.0  
**Last Updated:** January 9, 2026  
**Status:** Simple & Clear ✅
