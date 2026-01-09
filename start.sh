#!/bin/bash

# START SMART LOGISTICS SYSTEM
# ===========================
# This script starts all components of the Smart Logistics system

set -e

PROJECT_DIR="/Users/varshithreddy/connections/Smart-logistics"
VENV_PYTHON="/Users/varshithreddy/connections/.venv/bin/python"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║       🚀 SMART LOGISTICS SYSTEM STARTUP SCRIPT 🚀               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✓ Changed to project directory${NC}"

# Check if Python exists
if [ ! -f "$VENV_PYTHON" ]; then
    echo -e "${RED}❌ Python not found at: $VENV_PYTHON${NC}"
    echo "Please ensure your Python virtual environment is set up."
    exit 1
fi

echo -e "${GREEN}✓ Python found at: $VENV_PYTHON${NC}"

# Kill any existing processes on the ports
echo -e "${YELLOW}🧹 Cleaning up any existing processes...${NC}"
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8001 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Ask user which components to start
echo ""
echo -e "${BLUE}Select what to start:${NC}"
echo "1) Backend only (port 8000)"
echo "2) Frontend only (port 8080)"
echo "3) ML Service only (port 8001)"
echo "4) Backend + Frontend"
echo "5) All (Backend + Frontend + ML Service)"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1|4|5)
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Starting Backend (Port 8000)...${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        $VENV_PYTHON backend/logistics_backend.py &
        BACKEND_PID=$!
        echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
        sleep 3
        ;;
esac

case $choice in
    2|4|5)
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Starting Frontend (Port 8080)...${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        python -m http.server 8080 &
        FRONTEND_PID=$!
        echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
        sleep 2
        ;;
esac

case $choice in
    3|5)
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Starting ML Service (Port 8001)...${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        $VENV_PYTHON ml_service/main.py &
        ML_PID=$!
        echo -e "${GREEN}✓ ML Service started (PID: $ML_PID)${NC}"
        sleep 2
        ;;
esac

# Wait a bit for services to start
sleep 2

# Show running services
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SERVICES STARTED!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check and display which services are running
if lsof -i:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API${NC}  → http://localhost:8000"
    echo -e "${GREEN}  ├─ API Docs: http://localhost:8000/docs${NC}"
    echo -e "${GREEN}  └─ Health Check: curl http://localhost:8000/health${NC}"
fi

if lsof -i:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend${NC}     → http://localhost:8080"
fi

if lsof -i:8001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ML Service${NC}   → http://localhost:8001"
fi

echo ""
echo -e "${YELLOW}📝 NEXT STEPS:${NC}"
echo "1. Open browser: http://localhost:8080"
echo "2. Click 'Go Online' button"
echo "3. Accept a ride request"
echo "4. Click 'Report Issue' to test delay event"
echo "5. Watch the ML-powered decision making!"
echo ""

echo -e "${YELLOW}📊 MONITORING:${NC}"
echo "• Browser Console: Press F12"
echo "• Look for [API] log messages"
echo "• Backend logs appear in this terminal"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Wait for interrupt
wait
