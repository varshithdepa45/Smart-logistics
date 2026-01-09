// Mapbox Access Token
mapboxgl.accessToken = "pk.eyJ1IjoiaGVtYW50aDA0IiwiYSI6ImNtazZtaGswNzAyOWQzZXNkanhyaTlkY3UifQ.Ofpbw_IWXGXdG-PgUphK0g";

// Global variables
let map;
let directions;
let userMarker;
let isOnline = false;
let rideInProgress = false;
let currentRide = null;
let onlineTimer = null;
let onlineStartTime = null;
let requestTimer = null;
let requestTimeLeft = 30;
let notifications = [];
let reassignmentInProgress = false;
let emergencyModalOpen = false;
let selectedPriority = 'high';
let selectedReason = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
  // Initialize geolocation
  navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
    enableHighAccuracy: true
  });

  // Setup event listeners
  setupEventListeners();

  // Initialize UI
  initializeUI();

  // Simulate system notifications
  initializeNotifications();
});

function successLocation(position) {
  setupMap([position.coords.longitude, position.coords.latitude]);
  addUserMarker(position.coords.longitude, position.coords.latitude);
}

function errorLocation() {
  setupMap([77.5946, 12.9716]);
  addUserMarker(77.5946, 12.9716);
}

function setupMap(center) {
  // Initialize map
  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: center,
    zoom: 14
  });

  // Add navigation controls
  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav);

  // Add directions control
  directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric',
    profile: 'mapbox/driving',
    controls: {
      instructions: false,
      profileSwitcher: false
    }
  });

  map.addControl(directions, "top-left");

  // Hide directions controls initially
  setTimeout(() => {
    const dirControl = document.querySelector('.mapboxgl-ctrl-directions');
    if (dirControl) dirControl.style.display = 'none';
  }, 500);

  // Add geolocate control
  const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  });
  map.addControl(geolocate);

  // When map loads, trigger geolocation
  map.on('load', function () {
    geolocate.trigger();
  });
}

function addUserMarker(lng, lat) {
  // Remove existing marker if present
  if (userMarker) {
    userMarker.remove();
  }

  // Create a custom marker element
  const el = document.createElement('div');
  el.className = 'user-marker';
  el.innerHTML = '<i class="fas fa-motorcycle"></i>';

  // Add marker to map
  userMarker = new mapboxgl.Marker({
    element: el,
    anchor: 'bottom'
  })
    .setLngLat([lng, lat])
    .addTo(map);
}

function initializeUI() {
  // Initially hide panels
  document.getElementById('rideRequest').style.display = 'none';
  document.getElementById('activeRide').style.display = 'none';
  document.getElementById('emergencyModal').style.display = 'none';
  document.getElementById('nearbyDrivers').style.display = 'none';

  // Update notification count
  updateNotificationCount();
}

function setupEventListeners() {
  // Online/Offline toggle
  document.getElementById('toggleOnline').addEventListener('click', toggleOnlineStatus);

  // Ride actions
  document.getElementById('acceptRide').addEventListener('click', acceptRide);
  document.getElementById('rejectRide').addEventListener('click', rejectRide);
  document.getElementById('completeRide').addEventListener('click', completeRide);

  // Reassignment buttons
  document.getElementById('reassignRequest').addEventListener('click', showNearbyDrivers);
  document.getElementById('reassignActiveRide').addEventListener('click', openEmergencyModal);

  // Emergency buttons
  document.getElementById('raiseEmergency').addEventListener('click', openEmergencyModal);
  document.getElementById('callSupport').addEventListener('click', callSupport);

  // Emergency modal
  document.getElementById('closeModal').addEventListener('click', closeEmergencyModal);
  document.getElementById('cancelEmergency').addEventListener('click', closeEmergencyModal);
  document.getElementById('submitEmergency').addEventListener('click', submitEmergencyRequest);

  // Map controls
  document.getElementById('locateMe').addEventListener('click', locateUser);
  document.getElementById('zoomIn').addEventListener('click', () => map.zoomIn());
  document.getElementById('zoomOut').addEventListener('click', () => map.zoomOut());
  document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
  document.getElementById('notificationBell').addEventListener('click', toggleNotifications);
  document.getElementById('clearNotifications').addEventListener('click', clearAllNotifications);

  // Priority buttons
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      selectPriority(this);
    });
  });

  // Reason options
  document.querySelectorAll('input[name="reassignReason"]').forEach(radio => {
    radio.addEventListener('change', function () {
      selectedReason = this.value;
    });
  });

  // Click outside modal to close
  document.getElementById('emergencyModal').addEventListener('click', function (e) {
    if (e.target === this) {
      closeEmergencyModal();
    }
  });
}

function toggleOnlineStatus() {
  const toggleBtn = document.getElementById('toggleOnline');
  const statusIndicator = toggleBtn.querySelector('.status-indicator');
  const statusText = toggleBtn.querySelector('.status-text');
  const statusBarText = document.getElementById('statusText');
  const driverStatus = document.getElementById('driverStatus');

  isOnline = !isOnline;

  if (isOnline) {
    // Go online
    statusIndicator.className = 'status-indicator online';
    statusText.textContent = 'Go Offline';
    driverStatus.textContent = 'Online';
    driverStatus.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
    statusBarText.textContent = 'You are now online and receiving ride requests.';
    toggleBtn.style.backgroundColor = '#f0f0f0';
    toggleBtn.style.color = '#333';

    // Start online timer
    onlineStartTime = new Date();
    startOnlineTimer();

    // Simulate receiving a ride request after 3 seconds
    setTimeout(simulateRideRequest, 3000);

    // Show ride request panel
    document.getElementById('rideRequest').style.display = 'block';

    // Add notification
    addNotification('system', 'You are now online', 'You will start receiving ride requests shortly.', 'info');
  } else {
    // Go offline
    statusIndicator.className = 'status-indicator offline';
    statusText.textContent = 'Go Online';
    driverStatus.textContent = 'Offline';
    driverStatus.style.backgroundColor = 'rgba(244, 67, 54, 0.3)';
    statusBarText.textContent = 'You\'re currently offline. Tap "Go Online" to start receiving rides.';
    toggleBtn.style.backgroundColor = 'white';
    toggleBtn.style.color = '#ff6b00';

    // Stop online timer
    stopOnlineTimer();

    // Stop request timer if active
    if (requestTimer) {
      clearInterval(requestTimer);
      requestTimer = null;
    }

    // Hide ride request panel
    document.getElementById('rideRequest').style.display = 'none';

    // If there's a ride in progress, cancel it
    if (rideInProgress) {
      cancelRide('Driver went offline');
    }

    // Add notification
    addNotification('system', 'You are now offline', 'You will not receive new ride requests.', 'info');
  }
}

function startOnlineTimer() {
  if (onlineTimer) clearInterval(onlineTimer);

  onlineTimer = setInterval(() => {
    const now = new Date();
    const diff = now - onlineStartTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    document.getElementById('onlineTime').textContent = `${hours}h ${minutes}m`;
  }, 60000);
}

function stopOnlineTimer() {
  if (onlineTimer) {
    clearInterval(onlineTimer);
    onlineTimer = null;
  }
}

function simulateRideRequest() {
  if (!isOnline || rideInProgress || reassignmentInProgress) return;

  // Only simulate if driver is online and no ride in progress
  const pickupLocations = [
    { name: "MG Road, Bangalore", coords: [77.6105, 12.9758], address: "Near UB City" },
    { name: "Indiranagar, Bangalore", coords: [77.6408, 12.9784], address: "100 Feet Road" },
    { name: "Koramangala, Bangalore", coords: [77.6245, 12.9279], address: "Near Forum Mall" },
    { name: "Whitefield, Bangalore", coords: [77.7500, 12.9698], address: "ITPL Road" }
  ];

  const dropLocations = [
    { name: "Jayanagar, Bangalore", coords: [77.5827, 12.9308], address: "4th Block" },
    { name: "HSR Layout, Bangalore", coords: [77.6387, 12.9123], address: "Sector 7" },
    { name: "Malleswaram, Bangalore", coords: [77.5667, 13.0067], address: "8th Cross" },
    { name: "Yeshwanthpur, Bangalore", coords: [77.5393, 13.0232], address: "Near Metro Station" }
  ];

  const pickup = pickupLocations[Math.floor(Math.random() * pickupLocations.length)];
  const drop = dropLocations[Math.floor(Math.random() * dropLocations.length)];
  const distance = (Math.random() * 10 + 2).toFixed(1);
  const fare = Math.floor(distance * 15 + 30);
  const timeToReach = Math.floor(distance * 3) + 5;

  // Update UI with ride request
  document.getElementById('pickupLocation').textContent = pickup.name;
  document.getElementById('dropLocation').textContent = drop.name;
  document.getElementById('rideDistance').textContent = `${distance} km`;
  document.getElementById('rideFare').textContent = `₹${fare}`;
  document.getElementById('timeToReach').textContent = `${timeToReach} mins`;

  // Start request timer
  startRequestTimer();

  // Store ride data
  currentRide = {
    id: `RIDE-${Date.now().toString().slice(-6)}`,
    pickup: pickup,
    drop: drop,
    distance: distance,
    fare: fare,
    timeToReach: timeToReach,
    customerName: "Rahul Sharma",
    customerPhone: "+91 98765 43210",
    customerRating: "4.5",
    status: "pending"
  };

  // Update ride ID in active panel
  document.getElementById('rideId').textContent = currentRide.id;

  // Show notification
  addNotification('ride_request', 'New Ride Request',
    `From ${pickup.name} to ${drop.name}. Fare: ₹${fare}. Distance: ${distance} km`,
    'urgent');

  // Update status
  document.getElementById('statusText').textContent =
    `New ride request received! You have 30 seconds to respond.`;
}

function startRequestTimer() {
  requestTimeLeft = 30;
  document.getElementById('requestTimer').textContent = requestTimeLeft;

  if (requestTimer) clearInterval(requestTimer);

  requestTimer = setInterval(() => {
    requestTimeLeft--;
    document.getElementById('requestTimer').textContent = requestTimeLeft;

    // Change color when time is running out
    if (requestTimeLeft <= 10) {
      document.querySelector('.request-timer').style.backgroundColor = '#f44336';
    }

    if (requestTimeLeft <= 0) {
      clearInterval(requestTimer);
      autoRejectRide();
    }
  }, 1000);
}

function autoRejectRide() {
  if (!currentRide) return;

  addNotification('system', 'Ride Auto-Rejected',
    `Ride ${currentRide.id} was auto-rejected due to timeout.`,
    'info');

  // Update status
  document.getElementById('statusText').textContent =
    `Ride auto-rejected due to timeout. Waiting for new requests.`;

  // Clear current ride
  currentRide = null;

  // Hide directions controls
  const dirControl = document.querySelector('.mapboxgl-ctrl-directions');
  if (dirControl) dirControl.style.display = 'none';

  // Simulate new request after 8 seconds
  if (isOnline && !rideInProgress) {
    setTimeout(simulateRideRequest, 8000);
  }
}

function acceptRide() {
  if (!currentRide || rideInProgress) return;

  // Stop request timer
  if (requestTimer) {
    clearInterval(requestTimer);
    requestTimer = null;
  }

  rideInProgress = true;

  // Hide ride request panel
  document.getElementById('rideRequest').style.display = 'none';

  // Show active ride panel
  const activeRidePanel = document.getElementById('activeRide');
  activeRidePanel.style.display = 'block';

  // Update active ride details
  document.getElementById('customerName').textContent = currentRide.customerName;
  document.getElementById('customerPhone').textContent = currentRide.customerPhone;
  document.getElementById('activePickup').textContent = currentRide.pickup.name;
  document.getElementById('activeDrop').textContent = currentRide.drop.name;

  // Update progress bar
  document.getElementById('rideProgress').style.width = '30%';
  document.getElementById('rideStatusText').textContent = 'Heading to pickup location';

  // Update status
  document.getElementById('statusText').textContent =
    `Ride accepted! Heading to pickup at ${currentRide.pickup.name}`;

  // Set directions to pickup location
  directions.setOrigin([currentRide.pickup.coords[0], currentRide.pickup.coords[1]]);
  directions.setDestination([currentRide.drop.coords[0], currentRide.drop.coords[1]]);

  // Show directions controls
  const dirControl = document.querySelector('.mapboxgl-ctrl-directions');
  if (dirControl) dirControl.style.display = 'block';

  // Add notification
  addNotification('ride_accepted', 'Ride Accepted',
    `You accepted ride ${currentRide.id}. Please proceed to pickup location.`,
    'success');

  // Simulate ride progress
  simulateRideProgress();
}

function rejectRide() {
  if (!currentRide) return;

  // Stop request timer
  if (requestTimer) {
    clearInterval(requestTimer);
    requestTimer = null;
  }

  // Update status
  document.getElementById('statusText').textContent =
    `Ride rejected. Waiting for new requests.`;

  // Add notification
  addNotification('ride_rejected', 'Ride Rejected',
    `You rejected ride ${currentRide.id}.`,
    'info');

  // Clear current ride
  currentRide = null;

  // Hide directions controls
  const dirControl = document.querySelector('.mapboxgl-ctrl-directions');
  if (dirControl) dirControl.style.display = 'none';

  // Simulate new request after 5 seconds
  if (isOnline && !rideInProgress) {
    setTimeout(simulateRideRequest, 5000);
  }
}

function completeRide() {
  if (!currentRide || !rideInProgress) return;

  // Update earnings
  const ridesCompleted = document.getElementById('ridesCompleted');
  const totalEarnings = document.getElementById('totalEarnings');

  const currentRides = parseInt(ridesCompleted.textContent);
  const currentEarnings = parseInt(totalEarnings.textContent.replace('₹', ''));

  ridesCompleted.textContent = currentRides + 1;
  totalEarnings.textContent = `₹${currentEarnings + currentRide.fare}`;

  // Reset ride state
  rideInProgress = false;

  // Hide active ride panel
  document.getElementById('activeRide').style.display = 'none';

  // Hide directions controls
  const dirControl = document.querySelector('.mapboxgl-ctrl-directions');
  if (dirControl) dirControl.style.display = 'none';

  // Update status
  document.getElementById('statusText').textContent =
    `Ride ${currentRide.id} completed! ₹${currentRide.fare} added to your earnings.`;

  // Add notification
  addNotification('ride_completed', 'Ride Completed',
    `You completed ride ${currentRide.id}. ₹${currentRide.fare} added to your earnings.`,
    'success');

  // Clear directions
  directions.removeRoutes();

  // Clear current ride
  const completedRide = currentRide;
  currentRide = null;

  // Simulate new request after 3 seconds if online
  if (isOnline) {
    setTimeout(simulateRideRequest, 3000);
  }
}

function cancelRide(reason) {
  rideInProgress = false;

  // Hide active ride panel
  document.getElementById('activeRide').style.display = 'none';

  // Hide directions controls
  const dirControl = document.querySelector('.mapboxgl-ctrl-directions');
  if (dirControl) dirControl.style.display = 'none';

  // Clear directions
  directions.removeRoutes();

  // Add notification
  addNotification('ride_cancelled', 'Ride Cancelled',
    `Ride ${currentRide?.id || ''} was cancelled. Reason: ${reason}`,
    'warning');

  currentRide = null;
}

function locateUser() {
  navigator.geolocation.getCurrentPosition(position => {
    map.flyTo({
      center: [position.coords.longitude, position.coords.latitude],
      zoom: 16,
      essential: true
    });

    // Update user marker
    addUserMarker(position.coords.longitude, position.coords.latitude);
  });
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('active');
}

function callSupport() {
  // In a real app, this would initiate a call to support
  const supportNumber = '+91 1800-123-4567';
  alert(`Calling customer Support: ${supportNumber}`);

  // Add notification
  addNotification('support', 'Support Call Initiated',
    `You called custom Support. Our executive will assist you shortly.`,
    'info');
}

function openEmergencyModal() {
  emergencyModalOpen = true;
  document.getElementById('emergencyModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Hide reassignment status
  document.getElementById('reassignmentStatus').style.display = 'none';
}

function closeEmergencyModal() {
  emergencyModalOpen = false;
  document.getElementById('emergencyModal').style.display = 'none';
  document.body.style.overflow = 'auto';

  // Reset form
  document.getElementById('emergencyNotes').value = '';
  selectedReason = '';

  // Uncheck all radio buttons
  document.querySelectorAll('input[name="reassignReason"]').forEach(radio => {
    radio.checked = false;
  });
}

function selectPriority(button) {
  // Remove active class from all buttons
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Add active class to clicked button
  button.classList.add('active');
  selectedPriority = button.getAttribute('data-priority');
}

function submitEmergencyRequest() {
  const notes = document.getElementById('emergencyNotes').value;

  // Validate selection
  if (!selectedReason) {
    alert('Please select a reason for reassignment/emergency.');
    return;
  }

  // Show processing status
  const statusDiv = document.getElementById('reassignmentStatus');
  statusDiv.className = 'reassignment-status status-pending active';
  statusDiv.innerHTML = `
        <h4><i class="fas fa-spinner fa-spin"></i> Processing Your Request</h4>
        <p>We are processing your ${selectedPriority} priority request. Please wait...</p>
    `;

  // Simulate API call delay
  setTimeout(() => {
    // In a real app, this would send the request to the server
    const success = Math.random() > 0.3; // 70% success rate

    if (success) {
      statusDiv.className = 'reassignment-status status-success active';
      statusDiv.innerHTML = `
                <h4><i class="fas fa-check-circle"></i> Request Submitted Successfully!</h4>
                <p>Your ${selectedPriority} priority request has been submitted.</p>
                <p><strong>Reason:</strong> ${getReasonText(selectedReason)}</p>
                <p><strong>Notes:</strong> ${notes || 'None provided'}</p>
                <p>Our team is looking for alternative drivers. You will be notified shortly.</p>
            `;

      // Add to reassignments count
      const reassignCount = document.getElementById('reassignmentsCount');
      reassignCount.textContent = parseInt(reassignCount.textContent) + 1;

      // Add notification
      addNotification('reassignment_requested', 'Reassignment Requested',
        `Your ${selectedPriority} priority reassignment request has been submitted.`,
        'emergency');

      // If there's an active ride, start reassignment process
      if (rideInProgress && currentRide) {
        reassignmentInProgress = true;
        startReassignmentProcess();
      }

      // Close modal after 5 seconds
      setTimeout(closeEmergencyModal, 5000);
    } else {
      statusDiv.className = 'reassignment-status status-failed active';
      statusDiv.innerHTML = `
                <h4><i class="fas fa-exclamation-circle"></i> Request Failed</h4>
                <p>We couldn't process your request at the moment. Please try again or call support.</p>
                <p>Error: Network timeout. Please check your connection.</p>
            `;
    }
  }, 2000);
}

function getReasonText(reasonCode) {
  const reasons = {
    'vehicle_issue': 'Vehicle Breakdown',
    'health_issue': 'Health Issue',
    'family_emergency': 'Family Emergency',
    'road_block': 'Road Block/Traffic',
    'customer_issue': 'Customer Issue',
    'other': 'Other Reason'
  };
  return reasons[reasonCode] || 'Unknown Reason';
}

function startReassignmentProcess() {
  if (!currentRide || !rideInProgress) return;

  // Update status
  document.getElementById('statusText').textContent =
    `Looking for alternative drivers for ride ${currentRide.id}...`;

  // Simulate finding nearby drivers
  setTimeout(() => {
    showNearbyDrivers();

    // Simulate driver assignments
    simulateDriverAssignments();
  }, 3000);
}

function showNearbyDrivers() {
  const nearbyPanel = document.getElementById('nearbyDrivers');
  const driversList = document.getElementById('driversList');

  // Toggle display
  if (nearbyPanel.classList.contains('active')) {
    nearbyPanel.classList.remove('active');
    return;
  }

  // Generate mock nearby drivers
  const mockDrivers = [
    { id: 1, name: 'Rajesh Kumar', distance: '0.8 km', rating: '4.7', available: true },
    { id: 2, name: 'Suresh Patel', distance: '1.2 km', rating: '4.9', available: true },
    { id: 3, name: 'Amit Sharma', distance: '1.5 km', rating: '4.5', available: true },
    { id: 4, name: 'Vikram Singh', distance: '2.1 km', rating: '4.8', available: false },
    { id: 5, name: 'Anil Gupta', distance: '2.5 km', rating: '4.6', available: true }
  ];

  // Populate drivers list
  driversList.innerHTML = '';
  mockDrivers.forEach(driver => {
    const driverItem = document.createElement('div');
    driverItem.className = `driver-item ${driver.available ? 'available' : 'busy'}`;
    driverItem.innerHTML = `
            <div class="driver-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="driver-details">
                <div class="driver-name">${driver.name}</div>
                <div class="driver-info">
                    <span>${driver.distance} away</span>
                    <span>${driver.rating} ★</span>
                </div>
            </div>
            ${driver.available ?
        `<button class="assign-btn" data-driver-id="${driver.id}">Assign</button>` :
        `<span class="driver-busy">Busy</span>`
      }
        `;
    driversList.appendChild(driverItem);
  });

  // Add event listeners to assign buttons
  driversList.querySelectorAll('.assign-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const driverId = this.getAttribute('data-driver-id');
      assignRideToDriver(driverId);
    });
  });

  // Show panel
  nearbyPanel.classList.add('active');
}

function assignRideToDriver(driverId) {
  // In a real app, this would send assignment request to server
  const driverName = document.querySelector(`[data-driver-id="${driverId}"]`).closest('.driver-item').querySelector('.driver-name').textContent;

  // Update status
  document.getElementById('statusText').textContent =
    `Requesting ${driverName} to accept ride ${currentRide.id}...`;

  // Show loading on button
  const assignBtn = document.querySelector(`[data-driver-id="${driverId}"]`);
  const originalText = assignBtn.textContent;
  assignBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...';
  assignBtn.disabled = true;

  // Simulate API call
  setTimeout(() => {
    const success = Math.random() > 0.5; // 50% success rate

    if (success) {
      // Driver accepted
      assignBtn.innerHTML = '<i class="fas fa-check"></i> Assigned';
      assignBtn.style.backgroundColor = '#4CAF50';

      // Update status
      document.getElementById('statusText').textContent =
        `${driverName} accepted ride ${currentRide.id}. Reassignment successful!`;

      // Add notification
      addNotification('reassignment_success', 'Ride Reassigned',
        `Ride ${currentRide.id} has been reassigned to ${driverName}.`,
        'success');

      // Complete reassignment process
      completeReassignment();
    } else {
      // Driver rejected
      assignBtn.innerHTML = '<i class="fas fa-times"></i> Declined';
      assignBtn.style.backgroundColor = '#f44336';

      // Update status
      document.getElementById('statusText').textContent =
        `${driverName} declined the ride. Looking for other drivers...`;

      // Re-enable button after 2 seconds
      setTimeout(() => {
        assignBtn.innerHTML = originalText;
        assignBtn.disabled = false;
        assignBtn.style.backgroundColor = '';
      }, 2000);
    }
  }, 2000);
}

function completeReassignment() {
  if (!reassignmentInProgress) return;

  // Reset states
  reassignmentInProgress = false;
  rideInProgress = false;

  // Hide panels after delay
  setTimeout(() => {
    document.getElementById('activeRide').style.display = 'none';
    document.getElementById('nearbyDrivers').classList.remove('active');

    // Clear directions
    directions.removeRoutes();

    // Clear current ride
    currentRide = null;

    // Update status
    document.getElementById('statusText').textContent =
      `Ride reassigned successfully. You are now available for new rides.`;

    // Simulate new request after 5 seconds if online
    if (isOnline) {
      setTimeout(simulateRideRequest, 5000);
    }
  }, 3000);
}

function simulateDriverAssignments() {
  // Simulate automatic driver assignment attempts
  let attempts = 0;
  const maxAttempts = 3;

  const attemptAssignment = () => {
    if (attempts >= maxAttempts || !reassignmentInProgress) return;

    attempts++;

    // Simulate finding a driver
    setTimeout(() => {
      if (Math.random() > 0.6 && reassignmentInProgress) { // 40% success rate
        // Successfully assigned
        document.getElementById('statusText').textContent =
          `Ride ${currentRide.id} has been reassigned to another driver.`;

        addNotification('reassignment_auto', 'Ride Auto-Reassigned',
          `System automatically reassigned ride ${currentRide.id} to another driver.`,
          'info');

        completeReassignment();
      } else if (attempts < maxAttempts) {
        // Try again
        document.getElementById('statusText').textContent =
          `Attempt ${attempts + 1}: Looking for available drivers...`;
        attemptAssignment();
      } else {
        // All attempts failed
        document.getElementById('statusText').textContent =
          `Could not reassign ride ${currentRide.id}. Please continue the ride or call support.`;

        addNotification('reassignment_failed', 'Reassignment Failed',
          `System could not reassign ride ${currentRide.id} after ${maxAttempts} attempts.`,
          'warning');

        reassignmentInProgress = false;
      }
    }, 3000);
  };

  attemptAssignment();
}

function simulateRideProgress() {
  if (!rideInProgress || !currentRide) return;

  let progress = 30;
  const progressBar = document.getElementById('rideProgress');
  const statusText = document.getElementById('rideStatusText');

  // Simulate progress updates
  const progressInterval = setInterval(() => {
    if (!rideInProgress) {
      clearInterval(progressInterval);
      return;
    }

    progress += 10;
    progressBar.style.width = `${progress}%`;

    if (progress >= 100) {
      progress = 100;
      clearInterval(progressInterval);
      statusText.textContent = 'Ride completed! Tap "Complete Ride" to finish.';
      progressBar.style.background = 'linear-gradient(90deg, #4CAF50, #2E7D32)';
    } else if (progress >= 60) {
      statusText.textContent = 'On the way to drop location';
      progressBar.style.background = 'linear-gradient(90deg, #ff8c00, #ff6b00)';
    } else if (progress >= 50) {
      statusText.textContent = 'Customer picked up';
    }
  }, 5000); // Update every 5 seconds
}

// Notification System
function initializeNotifications() {
  // Add some initial notifications
  addNotification('system', 'Welcome to custom Driver',
    'You can go online to start receiving ride requests.', 'info');
  addNotification('system', 'Emergency Feature',
    'Use the emergency button to request reassignment in case of issues.', 'info');
}

function addNotification(type, title, message, priority = 'normal') {
  const notification = {
    id: Date.now(),
    type: type,
    title: title,
    message: message,
    priority: priority,
    timestamp: new Date(),
    read: false,
    actions: type === 'ride_request' ? ['accept', 'reject'] : []
  };

  notifications.unshift(notification); // Add to beginning
  renderNotifications();
  updateNotificationCount();

  // Show desktop notification if supported
  if (Notification.permission === "granted" && priority === 'urgent') {
    new Notification(title, {
      body: message,
      icon: 'https://rapido.bike/images/favicon.ico'
    });
  }
}

function renderNotifications() {
  const notificationsList = document.getElementById('notificationsList');
  notificationsList.innerHTML = '';

  // Show only last 5 notifications
  const recentNotifications = notifications.slice(0, 5);

  recentNotifications.forEach(notification => {
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item ${notification.priority} ${notification.read ? '' : 'unread'}`;
    notificationItem.dataset.id = notification.id;

    const timeAgo = getTimeAgo(notification.timestamp);

    let actionsHTML = '';
    if (notification.actions && notification.actions.length > 0) {
      actionsHTML = `
                <div class="notification-actions">
                    ${notification.actions.includes('accept') ?
          '<button class="notification-btn btn-accept-notif" data-action="accept">Accept</button>' : ''}
                    ${notification.actions.includes('reject') ?
          '<button class="notification-btn btn-reject-notif" data-action="reject">Reject</button>' : ''}
                    ${notification.actions.includes('view') ?
          '<button class="notification-btn btn-view-notif" data-action="view">View</button>' : ''}
                </div>
            `;
    }

    notificationItem.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${notification.title}</span>
                <span class="notification-time">${timeAgo}</span>
            </div>
            <div class="notification-message">${notification.message}</div>
            ${actionsHTML}
        `;

    notificationsList.appendChild(notificationItem);

    // Add click event to mark as read
    notificationItem.addEventListener('click', function (e) {
      if (!e.target.classList.contains('notification-btn')) {
        markNotificationAsRead(notification.id);
      }
    });

    // Add event listeners to action buttons
    notificationItem.querySelectorAll('.notification-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const action = this.getAttribute('data-action');
        handleNotificationAction(notification.id, action);
      });
    });
  });
}

function markNotificationAsRead(id) {
  const notification = notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    renderNotifications();
    updateNotificationCount();
  }
}

function handleNotificationAction(notificationId, action) {
  const notification = notifications.find(n => n.id === notificationId);
  if (!notification) return;

  switch (action) {
    case 'accept':
      if (notification.type === 'ride_request' && currentRide) {
        acceptRide();
      }
      break;
    case 'reject':
      if (notification.type === 'ride_request' && currentRide) {
        rejectRide();
      }
      break;
    case 'view':
      // Handle view action
      break;
  }

  // Remove notification after action
  notifications = notifications.filter(n => n.id !== notificationId);
  renderNotifications();
  updateNotificationCount();
}

function updateNotificationCount() {
  const unreadCount = notifications.filter(n => !n.read).length;
  document.getElementById('notificationCount').textContent = unreadCount;

  // Update bell icon style if there are unread notifications
  const bellIcon = document.querySelector('#notificationBell i');
  if (unreadCount > 0) {
    bellIcon.style.color = '#ff6b00';
    document.getElementById('notificationCount').style.display = 'flex';
  } else {
    bellIcon.style.color = '';
    document.getElementById('notificationCount').style.display = 'none';
  }
}

function clearAllNotifications() {
  notifications = [];
  renderNotifications();
  updateNotificationCount();
}

function toggleNotifications() {
  const notificationsPanel = document.querySelector('.notifications-panel');
  notificationsPanel.classList.toggle('expanded');
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Request notification permission
if ("Notification" in window && Notification.permission === "default") {
  setTimeout(() => {
    Notification.requestPermission();
  }, 3000);
}

// Add custom marker styles
const markerStyle = document.createElement('style');
markerStyle.textContent = `
    .user-marker {
        width: 40px;
        height: 40px;
        background-color: #ff6b00;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid white;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .driver-busy {
        color: #f44336;
        font-size: 0.85rem;
        padding: 4px 8px;
        background-color: #ffebee;
        border-radius: 4px;
    }
`;
document.head.appendChild(markerStyle);