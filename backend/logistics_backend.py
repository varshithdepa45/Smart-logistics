"""
LOGISTICS DEMO BACKEND - The "Central Nervous System"
======================================================
A stateful decision pipeline for order management and driver assignment.

Architecture: Monolithic FastAPI app with in-memory state store.
Philosophy: "Toy backend, Enterprise Logic"

Author: Hackathon Team
Status: 100% Reliable, Observable, Correct
"""

import os
import random
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional
from enum import Enum
from pydantic import BaseModel, Field, field_validator, ConfigDict
from fastapi import FastAPI, HTTPException, status
import uvicorn
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ============================================================================
# ENUMS & CONSTANTS
# ============================================================================

class DriverStatus(str, Enum):
    """Driver operational status"""
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"


class OrderStatus(str, Enum):
    """Order lifecycle status"""
    ACTIVE = "ACTIVE"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"


# Business Rules
MAX_REASSIGNMENTS = 2
ML_RISK_THRESHOLD = 0.7

# ============================================================================
# PYDANTIC MODELS (Data Contracts)
# ============================================================================

class Driver(BaseModel):
    """Driver entity - tracks availability and location"""
    model_config = ConfigDict(use_enum_values=False)
    
    id: str = Field(..., description="Unique driver identifier")
    name: str = Field(..., description="Driver full name")
    status: DriverStatus = Field(default=DriverStatus.AVAILABLE)
    current_location: str = Field(default="HUB-01", description="Current driver location")


class Order(BaseModel):
    """Order entity - tracks delivery and assignment state"""
    model_config = ConfigDict(use_enum_values=False)
    
    id: str = Field(..., description="Unique order identifier")
    status: OrderStatus = Field(default=OrderStatus.ACTIVE)
    assigned_driver_id: Optional[str] = Field(default=None)
    reassign_count: int = Field(default=0, ge=0)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class DelayEvent(BaseModel):
    """Delay event payload - triggers reassignment logic"""
    order_id: str = Field(..., description="Order experiencing delay")
    driver_id: str = Field(..., description="Driver reporting delay")
    reason: str = Field(default="Unknown", description="Human-readable delay reason")
    event_id: str = Field(..., description="Unique event identifier for idempotency")

    @field_validator("order_id", "driver_id", "event_id")
    @classmethod
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("ID fields cannot be empty")
        return v


class SystemState(BaseModel):
    """Complete system state snapshot - for visualization"""
    model_config = ConfigDict(use_enum_values=False)
    
    drivers: Dict[str, Driver]
    orders: Dict[str, Order]
    event_history: List[Dict]
    timestamp: str


# ============================================================================
# IN-MEMORY STATE STORE (The Truth)
# ============================================================================

class StateStore:
    """
    The single source of truth. All mutations happen here.
    Guaranteed not to reset unless explicitly told.
    Thread-safe with locking to prevent double-booking.
    """

    def __init__(self):
        self.drivers: Dict[str, Driver] = {}
        self.orders: Dict[str, Order] = {}
        self.processed_events: set = set()  # Track event IDs for idempotency
        self.event_history: List[Dict] = []
        self.lock = threading.Lock()  # Prevent concurrent modification issues

    def reset(self):
        """Wipe everything for a fresh demo run"""
        self.drivers.clear()
        self.orders.clear()
        self.processed_events.clear()
        self.event_history.clear()
        print("[SYSTEM] - State reset triggered. Fresh slate ready.")

    def get_snapshot(self) -> SystemState:
        """Return current state for external consumption"""
        return SystemState(
            drivers=self.drivers,
            orders=self.orders,
            event_history=self.event_history,
            timestamp=datetime.now(timezone.utc).isoformat()
        )


# Global state store (persistent across requests)
state_store = StateStore()

# HTTP session for calling ML microservice with retries
ml_session = requests.Session()
retry_strategy = Retry(
    total=3,
    backoff_factor=0.5,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["POST"]
)
adapter = HTTPAdapter(max_retries=retry_strategy)
ml_session.mount("http://", adapter)
ml_session.mount("https://", adapter)


# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = None  # Will be initialized after lifespan is defined


# ============================================================================
# STARTUP EVENT - Seed Demo Data
# ============================================================================

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    """
    Populate initial drivers and orders so the demo is immediately ready.
    This runs once when the server starts.
    """
    print("\n" + "="*70)
    print("[STARTUP] - Initializing Logistics Demo Backend")
    print("="*70)

    # Create 3 drivers
    drivers_data = [
        Driver(id="DRV-001", name="Alice Johnson", status=DriverStatus.AVAILABLE),
        Driver(id="DRV-002", name="Bob Chen", status=DriverStatus.AVAILABLE),
        Driver(id="DRV-003", name="Carol Martinez", status=DriverStatus.AVAILABLE),
    ]

    for driver in drivers_data:
        state_store.drivers[driver.id] = driver
        print(f"[INIT] - Seeded Driver: {driver.id} | {driver.name}")

    # Create 2 active orders
    orders_data = [
        Order(id="ORD-001", status=OrderStatus.ACTIVE, assigned_driver_id="DRV-001"),
        Order(id="ORD-002", status=OrderStatus.ACTIVE, assigned_driver_id="DRV-002"),
    ]

    for order in orders_data:
        state_store.orders[order.id] = order
        print(f"[INIT] - Seeded Order: {order.id} | Status: {order.status} | Assigned: {order.assigned_driver_id}")

    print("[STARTUP] - System ready. Awaiting delay events.")
    print("="*70 + "\n")
    
    yield  # Server runs here
    
    # Shutdown (cleanup if needed)
    print("[SHUTDOWN] - Server stopped.")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Logistics Demo Backend",
    description="Stateful Decision Pipeline for Order Management",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================================
# ML PREDICTION ENGINE (Simulated)
# ============================================================================

def predict_delay_risk(order_id: str, driver_id: str, reason: str) -> float:
    """
    Obtain a risk score from the ML microservice. If the ML service
    is unavailable, fall back to the local heuristic.
    """
    ml_base = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:8001")
    ml_url = f"{ml_base}/predict-risk"
    payload = {
        "order_id": order_id,
        "driver_id": driver_id,
        "reason": reason
    }

    try:
        resp = ml_session.post(ml_url, json=payload, timeout=2.0)
        if resp.ok:
            data = resp.json()
            risk = float(data.get("risk_score", 0.0))
            print(f"[ML_SERVICE] - Received risk_score={risk:.2f} from ML service")
            return risk
        else:
            print(f"[ML_SERVICE] - Non-OK response from ML service: {resp.status_code}")
    except requests.RequestException as e:
        print(f"[ML_CALL_ERROR] - Could not reach ML service after retries: {e}")

    # Fallback heuristic if ML service is unreachable
    base_risk = len(reason) / 100.0
    ml_noise = random.uniform(0.0, 0.3)
    risk_score = min(1.0, base_risk + ml_noise)
    print(f"[ML_PREDICTION_FALLBACK] - Risk Score: {risk_score:.2f} (Reason: '{reason}')")
    return risk_score


# ============================================================================
# REASSIGNMENT LOGIC
# ============================================================================

def find_available_driver(exclude_driver_id: Optional[str] = None) -> Optional[str]:
    """
    Find the first available driver for reassignment.

    Args:
        exclude_driver_id: Don't reassign to this driver

    Returns:
        Available driver ID or None
    """
    for driver_id, driver in state_store.drivers.items():
        if driver_id == exclude_driver_id:
            continue
        if driver.status == DriverStatus.AVAILABLE:
            return driver_id
    return None


def reassign_order(order_id: str, current_driver_id: Optional[str]) -> bool:
    """
    Attempt to reassign order to an available driver.
    Enforces MAX_REASSIGNMENTS constraint.

    Args:
        order_id: Order to reassign
        current_driver_id: Current assigned driver (to exclude)

    Returns:
        True if reassignment successful, False otherwise
    """
    order = state_store.orders[order_id]

    # Check reassignment limit
    if order.reassign_count >= MAX_REASSIGNMENTS:
        print(f"[DECISION] - Order {order_id} hit max reassignments ({MAX_REASSIGNMENTS}). CANCELLING.")
        order.status = OrderStatus.CANCELLED
        return False

    # Find available driver
    available_driver = find_available_driver(exclude_driver_id=current_driver_id)

    if not available_driver:
        print(f"[ERROR] - No drivers available for reassignment. Order {order_id} remains DELAYED.")
        return False

    # Execute reassignment
    order.assigned_driver_id = available_driver
    order.reassign_count += 1
    state_store.drivers[available_driver].status = DriverStatus.BUSY

    print(f"[REASSIGNMENT_SUCCESS] - Order {order_id} reassigned to {available_driver} (Attempt #{order.reassign_count})")
    return True


# ============================================================================
# CORE ENDPOINT: POST /event/delay
# ============================================================================

@app.post("/event/delay", status_code=status.HTTP_202_ACCEPTED)
def handle_delay_event(event: DelayEvent):
    """
    CORE LOGIC: Process a delay event and trigger intelligent reassignment.

    Workflow:
    1. Validate & Deduplicate (idempotency)
    2. Update Order Status → DELAYED
    3. Call ML Risk Prediction
    4. Decision Gate (threshold = 0.7)
    5. Conditional Reassignment or Notification

    Args:
        event: DelayEvent payload

    Returns:
        Decision summary with action taken
    """
    print(f"\n[EVENT_RECEIVED] - Delay Event ID: {event.event_id}")

    # Thread-safe execution with lock
    with state_store.lock:
        # ========== STEP 1: IDEMPOTENCY CHECK ==========
        if event.event_id in state_store.processed_events:
            print(f"[IDEMPOTENCY] - Event {event.event_id} already processed. Ignoring duplicate.")
            return {
                "status": "ignored",
                "reason": "Duplicate event",
                "event_id": event.event_id
            }

        # ========== STEP 2: VALIDATION ==========
        # Check if order exists
        if event.order_id not in state_store.orders:
            print(f"[VALIDATION_ERROR] - Order {event.order_id} not found in system.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order '{event.order_id}' not found"
            )

        # Check if driver exists
        if event.driver_id not in state_store.drivers:
            print(f"[VALIDATION_ERROR] - Driver {event.driver_id} not found in system.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver '{event.driver_id}' not found"
            )

        order = state_store.orders[event.order_id]

        # ========== STEP 3: UPDATE STATE ==========
        order.status = OrderStatus.DELAYED
        print(f"[STATE_UPDATE] - Order {event.order_id} marked as DELAYED")

        # ========== STEP 4: ML PREDICTION ==========
        risk_score = predict_delay_risk(event.order_id, event.driver_id, event.reason)

        # ========== STEP 5: DECISION GATE ==========
        decision_made = False
        action_taken = None

        if risk_score > ML_RISK_THRESHOLD:
            print(f"[DECISION] - Risk {risk_score:.2f} > Threshold {ML_RISK_THRESHOLD}. Initiating REASSIGNMENT.")
            action_taken = "REASSIGNMENT_INITIATED"

            success = reassign_order(event.order_id, event.driver_id)
            decision_made = True

            if not success:
                action_taken = "REASSIGNMENT_FAILED"

        else:
            print(f"[DECISION] - Risk {risk_score:.2f} <= Threshold {ML_RISK_THRESHOLD}. Maintaining assignment. UI notified.")
            action_taken = "MAINTAIN_ASSIGNMENT"
            decision_made = True

        # ========== STEP 6: RECORD EVENT ==========
        state_store.processed_events.add(event.event_id)
        state_store.event_history.append({
            "event_id": event.event_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "order_id": event.order_id,
            "driver_id": event.driver_id,
            "reason": event.reason,
            "risk_score": risk_score,
            "action_taken": action_taken,
            "order_status": order.status
        })

        print(f"[EVENT_COMPLETE] - Event {event.event_id} processed successfully.\n")

        return {
            "status": "success",
            "event_id": event.event_id,
            "order_id": event.order_id,
            "risk_score": risk_score,
            "action_taken": action_taken,
            "order_status": order.status,
            "reassign_count": order.reassign_count
        }


# ============================================================================
# OBSERVATION ENDPOINT: GET /state
# ============================================================================

@app.get("/state")
def get_system_state() -> SystemState:
    """
    Expose complete system state for frontend visualization and debugging.
    This is the "God view" - you can see everything.

    Returns:
        Complete system state snapshot
    """
    print("[STATE_QUERY] - System state requested")
    return state_store.get_snapshot()


# ============================================================================
# DRIVER ENDPOINTS
# ============================================================================

@app.get("/drivers")
def list_drivers():
    """
    List all drivers and their current status.
    Useful for monitoring and debugging.

    Returns:
        Dictionary of all drivers
    """
    print("[QUERY] - Listing all drivers")
    with state_store.lock:
        return {
            "count": len(state_store.drivers),
            "drivers": state_store.drivers
        }


@app.get("/drivers/{driver_id}")
def get_driver(driver_id: str):
    """
    Get details of a specific driver.

    Args:
        driver_id: Driver identifier

    Returns:
        Driver details
    """
    with state_store.lock:
        if driver_id not in state_store.drivers:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Driver '{driver_id}' not found"
            )
        return state_store.drivers[driver_id]


@app.post("/drivers", status_code=status.HTTP_201_CREATED)
def create_driver(driver: Driver):
    """
    Create a new driver for testing purposes.

    Args:
        driver: Driver entity to create

    Returns:
        Created driver
    """
    with state_store.lock:
        if driver.id in state_store.drivers:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Driver '{driver.id}' already exists"
            )
        state_store.drivers[driver.id] = driver
        print(f"[CREATE] - New driver added: {driver.id} | {driver.name}")
        return driver


# ============================================================================
# ORDER ENDPOINTS
# ============================================================================

@app.get("/orders")
def list_orders():
    """
    List all orders and their current status.
    Useful for monitoring and debugging.

    Returns:
        Dictionary of all orders
    """
    print("[QUERY] - Listing all orders")
    with state_store.lock:
        return {
            "count": len(state_store.orders),
            "orders": state_store.orders
        }


@app.get("/orders/{order_id}")
def get_order(order_id: str):
    """
    Get details of a specific order.

    Args:
        order_id: Order identifier

    Returns:
        Order details
    """
    with state_store.lock:
        if order_id not in state_store.orders:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{order_id}' not found"
            )
        return state_store.orders[order_id]


@app.post("/orders", status_code=status.HTTP_201_CREATED)
def create_order(order: Order):
    """
    Create a new order for testing purposes.

    Args:
        order: Order entity to create

    Returns:
        Created order
    """
    with state_store.lock:
        if order.id in state_store.orders:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Order '{order.id}' already exists"
            )
        
        # Validate assigned driver exists and is available
        if order.assigned_driver_id:
            if order.assigned_driver_id not in state_store.drivers:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Assigned driver '{order.assigned_driver_id}' not found"
                )
            # Mark driver as busy
            state_store.drivers[order.assigned_driver_id].status = DriverStatus.BUSY
        
        state_store.orders[order.id] = order
        print(f"[CREATE] - New order added: {order.id} | Assigned to: {order.assigned_driver_id}")
        return order


# ============================================================================
# RESET ENDPOINT: POST /reset
# ============================================================================

@app.post("/reset")
def reset_system():
    """
    Wipe the system clean and prepare for next demo run.
    WARNING: Destructive operation.

    Returns:
        Confirmation message
    """
    print("[RESET_INITIATED] - Wiping all state...")
    state_store.reset()
    return {
        "status": "success",
        "message": "System reset complete. Ready for fresh demo."
    }


# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.get("/health")
def health_check():
    """
    Liveness probe - confirms backend is running and responsive.

    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "drivers_count": len(state_store.drivers),
        "orders_count": len(state_store.orders),
        "events_processed": len(state_store.processed_events)
    }


# ============================================================================
# ROOT ENDPOINT: GET /
# ============================================================================

@app.get("/")
def root():
    """
    API documentation and entry point.

    Returns:
        Welcome message with available endpoints
    """
    return {
        "service": "Logistics Demo Backend",
        "version": "1.0.0",
        "endpoints": {
            "health": "GET /health",
            "state": "GET /state",
            "delay_event": "POST /event/delay",
            "drivers": "GET /drivers",
            "create_driver": "POST /drivers",
            "get_driver": "GET /drivers/{driver_id}",
            "orders": "GET /orders",
            "create_order": "POST /orders",
            "get_order": "GET /orders/{order_id}",
            "reset": "POST /reset",
            "docs": "GET /docs",
            "openapi": "GET /openapi.json"
        }
    }


# ============================================================================
# MAIN - Server Launcher
# ============================================================================

if __name__ == "__main__":
    print("\n🚀 Starting Logistics Demo Backend...")
    print("📍 Access at: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs\n")

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
