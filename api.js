/**
 * LOGISTICS FRONTEND API CLIENT
 * =============================
 * Handles all communication with the backend at http://localhost:8000
 * Includes WebSocket support for real-time event broadcasting
 */

const API_BASE_URL = "http://localhost:8000";
const WS_BASE_URL = "ws://localhost:8000";

// WebSocket connection for real-time events
let websocket = null;
let emergencyEventCallback = null;

// Store driver and system state
let driverProfile = {
  id: `DRIVER-${Date.now().toString().slice(-6)}`,
  name: "You",
  status: "AVAILABLE",
  current_location: "HUB-01",
};

let systemState = {};

/**
 * Initialize WebSocket Connection for Real-Time Emergency Events
 */
function initializeWebSocket(onEmergencyEvent) {
  try {
    emergencyEventCallback = onEmergencyEvent;
    websocket = new WebSocket(`${WS_BASE_URL}/ws`);

    websocket.onopen = () => {
      console.log(
        "[API] WebSocket connected - ready to receive emergency broadcasts"
      );
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[API] 🚨 Emergency event broadcast received:", data);

      if (data.type === "emergency_event" && emergencyEventCallback) {
        emergencyEventCallback(data);
      }
    };

    websocket.onerror = (error) => {
      console.error("[API] WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.warn(
        "[API] WebSocket disconnected - attempting to reconnect in 5s..."
      );
      setTimeout(initializeWebSocket, 5000);
    };

    return true;
  } catch (error) {
    console.error("[API] Failed to initialize WebSocket:", error);
    return false;
  }
}

/**
 * Health Check - Verify backend is running
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[API] Backend health check passed:", data);
    return true;
  } catch (error) {
    console.error("[API] Backend health check failed:", error);
    showNotification(
      "Backend Connection",
      "Unable to connect to backend. Some features may be unavailable.",
      "warning"
    );
    return false;
  }
}

/**
 * Get Complete System State
 * Returns: { drivers, orders, event_history, processed_events }
 */
async function fetchSystemState() {
  try {
    const response = await fetch(`${API_BASE_URL}/state`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    systemState = await response.json();
    console.log("[API] System state fetched:", systemState);
    return systemState;
  } catch (error) {
    console.error("[API] Failed to fetch system state:", error);
    return null;
  }
}

/**
 * Get All Drivers
 */
async function fetchAllDrivers() {
  try {
    const response = await fetch(`${API_BASE_URL}/drivers`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[API] Drivers fetched:", data);
    return data.drivers || {};
  } catch (error) {
    console.error("[API] Failed to fetch drivers:", error);
    return {};
  }
}

/**
 * Get Specific Driver
 */
async function fetchDriver(driverId) {
  try {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[API] Driver fetched:", data);
    return data;
  } catch (error) {
    console.error("[API] Failed to fetch driver:", error);
    return null;
  }
}

/**
 * Create or Update Driver
 * Call this when driver goes online/offline
 */
async function registerOrUpdateDriver(status = "AVAILABLE") {
  try {
    driverProfile.status = status;

    // Check if driver exists first
    const existing = await fetchDriver(driverProfile.id);
    if (existing) {
      // Update existing driver - just track status locally
      console.log("[API] Driver already registered:", driverProfile.id);
      return driverProfile;
    }

    // Create new driver
    const response = await fetch(`${API_BASE_URL}/drivers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(driverProfile),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[API] Driver registered:", data);
    return data;
  } catch (error) {
    console.error("[API] Failed to register driver:", error);
    return null;
  }
}

/**
 * Get All Orders
 */
async function fetchAllOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[API] Orders fetched:", data);
    return data.orders || {};
  } catch (error) {
    console.error("[API] Failed to fetch orders:", error);
    return {};
  }
}

/**
 * Get Specific Order
 */
async function fetchOrder(orderId) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[API] Order fetched:", data);
    return data;
  } catch (error) {
    console.error("[API] Failed to fetch order:", error);
    return null;
  }
}

/**
 * Create Order
 * Used to simulate accepting a ride request
 */
async function createOrder(orderId, assignedDriverId = null) {
  try {
    const order = {
      id: orderId,
      status: "ACTIVE",
      assigned_driver_id: assignedDriverId || driverProfile.id,
      reassign_count: 0,
    };

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[API] Order created:", data);
    return data;
  } catch (error) {
    console.error("[API] Failed to create order:", error);
    return null;
  }
}

/**
 * CORE ENDPOINT: Report Delay Event
 * This triggers the intelligent reassignment logic in the backend
 *
 * WORKFLOW:
 * 1. Validates delay event
 * 2. Calls ML service to predict risk
 * 3. If risk > 0.7, initiates reassignment
 * 4. Otherwise, maintains current assignment
 *
 * Returns: { status, event_id, risk_score, action_taken, reassign_count }
 */
async function reportDelayEvent(
  orderId,
  driverId,
  reason = "Unknown",
  priority = "high"
) {
  try {
    const eventId = `EVENT-${Date.now().toString().slice(-6)}`;

    const delayEvent = {
      order_id: orderId,
      driver_id: driverId,
      reason: reason,
      event_id: eventId,
    };

    console.log("[API] Reporting delay event:", delayEvent);

    const response = await fetch(`${API_BASE_URL}/event/delay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(delayEvent),
    });

    // Accept 202 Accepted status as success
    if (response.status !== 202 && !response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("[API] Delay event processed:", data);

    // Show result to user
    showDelayEventResult(data, priority);

    return data;
  } catch (error) {
    console.error("[API] Failed to report delay event:", error);
    showNotification(
      "Delay Report Failed",
      "Could not report delay to backend. " + error.message,
      "error"
    );
    return null;
  }
}

/**
 * Display delay event result to user
 */
function showDelayEventResult(result, priority) {
  const action = result.action_taken || "UNKNOWN";
  const risk = (result.risk_score * 100).toFixed(1);

  let message = "";
  let notificationType = "info";

  if (action === "REASSIGNMENT_INITIATED") {
    message = `Your order has been flagged for reassignment. Risk Score: ${risk}%. The system is finding an alternative driver.`;
    notificationType = "warning";
  } else if (action === "REASSIGNMENT_FAILED") {
    message = `Reassignment could not be completed. Risk Score: ${risk}%. Please contact support if needed.`;
    notificationType = "error";
  } else if (action === "MAINTAIN_ASSIGNMENT") {
    message = `Your current assignment is maintained. Risk Score: ${risk}%. Continue with caution.`;
    notificationType = "success";
  }

  // This will be called by the notification system
  console.log(
    `[DELAY_RESULT] Action: ${action}, Risk: ${risk}%, Message: ${message}`
  );
}

/**
 * Reset System State (for testing)
 */
async function resetSystem() {
  try {
    const response = await fetch(`${API_BASE_URL}/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("[API] System reset:", data);
    return data;
  } catch (error) {
    console.error("[API] Failed to reset system:", error);
    return null;
  }
}

/**
 * Initialize API Client
 * Call this when the page loads
 */
async function initializeAPIClient(onEmergencyEvent) {
  console.log("[API] Initializing API client...");

  // Check backend health
  const healthy = await checkBackendHealth();

  if (healthy) {
    // Fetch initial state
    await fetchSystemState();

    // Register this driver
    await registerOrUpdateDriver("AVAILABLE");

    // Initialize WebSocket for real-time events
    if (onEmergencyEvent) {
      initializeWebSocket(onEmergencyEvent);
    }

    console.log("[API] API client initialized successfully");
    return true;
  } else {
    console.warn("[API] Backend is not available. Using simulation mode.");
    return false;
  }
}

/**
 * Utility: Get driver name from ID
 */
function getDriverNameById(driverId) {
  if (systemState.drivers && systemState.drivers[driverId]) {
    return systemState.drivers[driverId].name || driverId;
  }
  return driverId;
}

/**
 * Utility: Get order details from ID
 */
function getOrderById(orderId) {
  if (systemState.orders && systemState.orders[orderId]) {
    return systemState.orders[orderId];
  }
  return null;
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    API_BASE_URL,
    WS_BASE_URL,
    driverProfile,
    systemState,
    initializeWebSocket,
    checkBackendHealth,
    fetchSystemState,
    fetchAllDrivers,
    fetchDriver,
    registerOrUpdateDriver,
    fetchAllOrders,
    fetchOrder,
    createOrder,
    reportDelayEvent,
    resetSystem,
    initializeAPIClient,
    getDriverNameById,
    getOrderById,
  };
}
