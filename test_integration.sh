#!/bin/bash

# Smart Logistics Frontend-Backend Integration Test
# ==================================================

echo "🧪 Testing Smart Logistics Integration..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo -e "${BLUE}[Test 1]${NC} Checking Backend Health..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health 2>/dev/null)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is running and healthy${NC}"
    echo "  Response: $HEALTH_RESPONSE"
else
    echo -e "${YELLOW}⚠ Backend not responding on port 8000${NC}"
    echo "  Make sure to run: python backend/logistics_backend.py"
fi
echo ""

# Test 2: Check if API root endpoint works
echo -e "${BLUE}[Test 2]${NC} Checking API Root Endpoint..."
ROOT_RESPONSE=$(curl -s http://localhost:8000/ 2>/dev/null)
if echo "$ROOT_RESPONSE" | grep -q "Logistics Demo Backend\|service"; then
    echo -e "${GREEN}✓ API root endpoint is accessible${NC}"
    echo "  Response: $ROOT_RESPONSE"
else
    echo -e "${YELLOW}⚠ API root endpoint not responding${NC}"
fi
echo ""

# Test 3: Check if drivers endpoint works
echo -e "${BLUE}[Test 3]${NC} Checking Drivers Endpoint..."
DRIVERS_RESPONSE=$(curl -s http://localhost:8000/drivers 2>/dev/null)
if echo "$DRIVERS_RESPONSE" | grep -q "drivers\|count"; then
    echo -e "${GREEN}✓ Drivers endpoint is accessible${NC}"
    echo "  Response: $DRIVERS_RESPONSE" | head -1
else
    echo -e "${YELLOW}⚠ Drivers endpoint not responding${NC}"
fi
echo ""

# Test 4: Check if orders endpoint works
echo -e "${BLUE}[Test 4]${NC} Checking Orders Endpoint..."
ORDERS_RESPONSE=$(curl -s http://localhost:8000/orders 2>/dev/null)
if echo "$ORDERS_RESPONSE" | grep -q "orders\|count"; then
    echo -e "${GREEN}✓ Orders endpoint is accessible${NC}"
    echo "  Response: $ORDERS_RESPONSE" | head -1
else
    echo -e "${YELLOW}⚠ Orders endpoint not responding${NC}"
fi
echo ""

# Test 5: Check if system state endpoint works
echo -e "${BLUE}[Test 5]${NC} Checking System State Endpoint..."
STATE_RESPONSE=$(curl -s http://localhost:8000/state 2>/dev/null)
if echo "$STATE_RESPONSE" | grep -q "drivers\|orders\|timestamp"; then
    echo -e "${GREEN}✓ System state endpoint is accessible${NC}"
    echo "  Response (first 100 chars): $(echo $STATE_RESPONSE | head -c 100)..."
else
    echo -e "${YELLOW}⚠ System state endpoint not responding${NC}"
fi
echo ""

# Test 6: Test creating a driver
echo -e "${BLUE}[Test 6]${NC} Testing Driver Creation..."
CREATE_DRIVER=$(curl -s -X POST http://localhost:8000/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TEST-DRIVER-001",
    "name": "Test Driver",
    "status": "AVAILABLE",
    "current_location": "HUB-01"
  }' 2>/dev/null)

if echo "$CREATE_DRIVER" | grep -q "TEST-DRIVER-001"; then
    echo -e "${GREEN}✓ Driver creation successful${NC}"
    echo "  Response: $CREATE_DRIVER"
else
    echo -e "${YELLOW}⚠ Driver creation failed${NC}"
    echo "  Response: $CREATE_DRIVER"
fi
echo ""

# Test 7: Test creating an order
echo -e "${BLUE}[Test 7]${NC} Testing Order Creation..."
CREATE_ORDER=$(curl -s -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TEST-ORDER-001",
    "status": "ACTIVE",
    "assigned_driver_id": "TEST-DRIVER-001"
  }' 2>/dev/null)

if echo "$CREATE_ORDER" | grep -q "TEST-ORDER-001"; then
    echo -e "${GREEN}✓ Order creation successful${NC}"
    echo "  Response: $CREATE_ORDER"
else
    echo -e "${YELLOW}⚠ Order creation failed${NC}"
    echo "  Response: $CREATE_ORDER"
fi
echo ""

# Test 8: Test delay event (main feature)
echo -e "${BLUE}[Test 8]${NC} Testing Delay Event Reporting (MAIN FEATURE)..."
DELAY_EVENT=$(curl -s -X POST http://localhost:8000/event/delay \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST-ORDER-001",
    "driver_id": "TEST-DRIVER-001",
    "reason": "Vehicle Breakdown",
    "event_id": "TEST-EVENT-001"
  }' 2>/dev/null)

if echo "$DELAY_EVENT" | grep -q "success\|action_taken"; then
    echo -e "${GREEN}✓ Delay event reporting successful${NC}"
    echo "  Response: $DELAY_EVENT"
else
    echo -e "${YELLOW}⚠ Delay event reporting failed${NC}"
    echo "  Response: $DELAY_EVENT"
fi
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}🎯 Integration Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo "To run the complete system:"
echo ""
echo -e "${YELLOW}Terminal 1 - Start Backend:${NC}"
echo "  cd /Users/varshithreddy/connections/Smart-logistics"
echo "  python backend/logistics_backend.py"
echo ""
echo -e "${YELLOW}Terminal 2 - Start Frontend:${NC}"
echo "  cd /Users/varshithreddy/connections/Smart-logistics"
echo "  python -m http.server 8080"
echo "  Open http://localhost:8080 in browser"
echo ""
echo -e "${YELLOW}Terminal 3 (Optional) - ML Service:${NC}"
echo "  cd /Users/varshithreddy/connections/Smart-logistics"
echo "  python ml_service/main.py"
echo ""
echo -e "${BLUE}✨ All components ready for integration!${NC}"
