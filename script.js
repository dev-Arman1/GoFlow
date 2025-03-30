// Initialize the map with a modern dark theme
let map = L.map('map').setView([28.6139, 77.2090], 6); // Default: New Delhi

// Add a custom-styled tile layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

let startMarker, endMarker, routeLayer;
let startCoords, endCoords;

// Custom markers for better visual appeal
const startIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Improved toast notification
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-content">${message}</div>`;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Add toast styles to the document
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    .toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
    .toast-success {
        background: #28a745;
    }
    .toast-error {
        background: #dc3545;
    }
    .toast-info {
        background: #3a86ff;
    }
    .total-cost-item {
        border-top: 2px solid #f1f1f1 !important;
        padding-top: 12px !important;
        margin-top: 5px;
    }
    .total-cost-item .info-label, 
    .total-cost-item .info-value {
        font-size: 1.1em;
        font-weight: 700;
        color: var(--accent);
    }
`;
document.head.appendChild(style);

// Function to search for the start location with improved error handling
function searchStartLocation() {
    const query = document.getElementById('searchStartInput').value;
    if (query) {
        showToast(`Searching for "${query}"...`, 'info');
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.length > 0) {
                    const firstResult = data[0];
                    const lat = parseFloat(firstResult.lat);
                    const lon = parseFloat(firstResult.lon);
                    startCoords = { lat, lng: lon };
                    
                    if (startMarker) map.removeLayer(startMarker);
                    
                    startMarker = L.marker([lat, lon], {icon: startIcon}).addTo(map)
                        .bindPopup(`<b>Start:</b> ${firstResult.display_name.split(',').slice(0, 2).join(',')}`)
                        .openPopup();
                    
                    map.flyTo([lat, lon], 13, {
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                    
                    showToast('Start location set!', 'success');
                } else {
                    showToast('Start location not found. Try a different search.', 'error');
                }
            })
            .catch(err => {
                console.error("Error searching start location:", err);
                showToast('Error searching location. Please try again.', 'error');
            });
    } else {
        showToast('Please enter a start location to search.', 'error');
    }
}

// Function to search for the destination location
function searchEndLocation() {
    const query = document.getElementById('searchEndInput').value;
    if (query) {
        showToast(`Searching for "${query}"...`, 'info');
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.length > 0) {
                    const firstResult = data[0];
                    const lat = parseFloat(firstResult.lat);
                    const lon = parseFloat(firstResult.lon);
                    endCoords = { lat, lng: lon };
                    
                    if (endMarker) map.removeLayer(endMarker);
                    
                    endMarker = L.marker([lat, lon], {icon: endIcon}).addTo(map)
                        .bindPopup(`<b>Destination:</b> ${firstResult.display_name.split(',').slice(0, 2).join(',')}`)
                        .openPopup();
                    
                    map.flyTo([lat, lon], 13, {
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                    
                    showToast('Destination set!', 'success');
                } else {
                    showToast('Destination not found. Try a different search.', 'error');
                }
            })
            .catch(err => {
                console.error("Error searching destination location:", err);
                showToast('Error searching location. Please try again.', 'error');
            });
    } else {
        showToast('Please enter a destination location to search.', 'error');
    }
}

// Function to set the start location by clicking on the map with visual cue
function setStart() {
    showToast('Click on the map to set start point', 'info');
    
    // Add a visual cursor hint
    document.body.style.cursor = 'crosshair';
    
    map.once('click', function (e) {
        if (startMarker) map.removeLayer(startMarker);
        startCoords = e.latlng;
        startMarker = L.marker(startCoords, {icon: startIcon, bounceOnAdd: true}).addTo(map)
            .bindPopup("<b>Start</b>").openPopup();
        
        // Reset cursor
        document.body.style.cursor = '';
        
        showToast('Start point set!', 'success');
    });
}

// Function to set the destination location by clicking on the map
function setEnd() {
    showToast('Click on the map to set destination point', 'info');
    
    // Add a visual cursor hint
    document.body.style.cursor = 'crosshair';
    
    map.once('click', function (e) {
        if (endMarker) map.removeLayer(endMarker);
        endCoords = e.latlng;
        endMarker = L.marker(endCoords, {icon: endIcon, bounceOnAdd: true}).addTo(map)
            .bindPopup("<b>Destination</b>").openPopup();
        
        // Reset cursor
        document.body.style.cursor = '';
        
        showToast('Destination point set!', 'success');
    });
}

// Function to find the route between start and destination with enhanced visualization
function findRoute() {
    if (!startCoords || !endCoords) {
        showToast('Please select both start and destination points.', 'error');
        return;
    }

    showToast('Calculating your route...', 'info');

    if (routeLayer) map.removeLayer(routeLayer);

    let apiUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=full&geometries=geojson`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                let route = data.routes[0];
                let distanceKm = (route.distance / 1000).toFixed(2);
                
                // Animate the distance value change
                animateValue('distance', distanceKm);

                let speed = parseFloat(document.getElementById('speedInput').value) || 60;
                let estimatedTime = (distanceKm / speed).toFixed(2);
                
                // Animate the time value change
                animateValue('time', estimatedTime + " hours");

                let mileage = parseFloat(document.getElementById('mileageInput').value) || 15;
                let fuelPrice = parseFloat(document.getElementById('fuelPriceInput').value) || 100;
                let fuelCost = ((distanceKm / mileage) * fuelPrice).toFixed(2);
                
                // Animate the fuel cost value change
                animateValue('fuelCost', fuelCost);

                let tollCostPerKm = parseFloat(document.getElementById('tollCostInput').value) || 1;
                let totalTollCost = (distanceKm * tollCostPerKm).toFixed(2);
                
                // Animate the toll cost value change
                animateValue('totalTollCost', totalTollCost);

                // Calculate and display total cost (fuel cost + toll cost)
                let totalCost = (parseFloat(fuelCost) + parseFloat(totalTollCost)).toFixed(2);
                
                // Animate the total cost value change
                animateValue('totalCost', totalCost);

                // Style the route with animation
                routeLayer = L.geoJSON(route.geometry, {
                    style: {
                        color: '#3a86ff',
                        weight: 6,
                        opacity: 0.8,
                        lineCap: 'round',
                        lineJoin: 'round',
                        dashArray: '1, 10',
                        dashOffset: '0'
                    }
                }).addTo(map);
                
                // Animate the route
                const routePath = document.querySelector('.leaflet-interactive');
                if (routePath) {
                    routePath.style.strokeDasharray = route.distance / 30;
                    routePath.style.strokeDashoffset = route.distance / 30;
                    routePath.style.animation = 'drawRoute 1.5s forwards';
                }

                // Show the info panel if it's hidden
                document.getElementById('routeInfo').style.display = 'block';
                
                // Fit map to show the entire route with padding
                map.fitBounds(routeLayer.getBounds(), {
                    padding: [50, 50],
                    animate: true,
                    duration: 1
                });
                
                showToast('Route calculated successfully!', 'success');
            } else {
                showToast('Could not find a route between these points.', 'error');
            }
        })
        .catch(err => {
            console.error("Error fetching route:", err);
            showToast('Error calculating route. Please try again.', 'error');
        });
}

// Function to animate value changes
function animateValue(elementId, newValue) {
    const element = document.getElementById(elementId);
    element.classList.add('value-change');
    element.textContent = newValue;
    
    setTimeout(() => {
        element.classList.remove('value-change');
    }, 500);
}

// Add responsive panel toggle for mobile
document.getElementById('panelToggle').addEventListener('click', function() {
    const leftPanel = document.getElementById('leftPanel');
    leftPanel.classList.toggle('collapsed');
});

// Key press events for better UX
document.getElementById('searchStartInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchStartLocation();
    }
});

document.getElementById('searchEndInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchEndLocation();
    }
});

// Hide route info panel initially
document.getElementById('routeInfo').style.display = 'none';

// Add a welcome toast when the page loads
window.addEventListener('load', function() {
    setTimeout(() => {
        showToast('Welcome to GoFlow Maps! Start by setting your route points.', 'info');
    }, 1000);
});