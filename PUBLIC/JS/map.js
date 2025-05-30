// Oscar Collins 2025
// SAE203 groupe A2
// AI usage: Written with much Ai help, some functions copied from old project (SAE105), renderPathInfo() function fully AI
//           comments written by AI. GPT4.1-mini

// MAP -----------------------------------------------------------------------------

// Initialize the Leaflet map centered on France with zoom level 6.
var map = L.map('map').setView([46.603354, 1.888334], 6);

// Add OpenStreetMap tile layer with attribution and max zoom level.
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);
//----------------------------------------------------------------------------------


// SIMULATE BUTTON-------------------------------------------------------------------

// Arrays to store markers and polylines so they can be removed before new simulation.
let markers = [];
let polylines = [];

// Add click event listener to the "simulate" button.
document.getElementById('simulate').addEventListener('click', function() {
    // Remove existing markers and polylines from the map.
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    polylines.forEach(l => map.removeLayer(l));
    polylines = [];

    // Retrieve selected start and destination data.
    const start = selectedData['start'];
    const destination = selectedData['destination'];

    // Validate that both start and destination are selected.
    if (!start || !destination) {
        alert('Please select both start and destination.');
        return;
    }

    const startId = start[0];
    const finishId = destination[0];

    // Fetch the journey path from the server.
    fetch(`../../SRC/CreatePath.php?start=${encodeURIComponent(startId)}&finish=${encodeURIComponent(finishId)}`)
        .then(r => r.json())
        .then(data => {
            // Validate the returned journey data.
            if (!data.journey || !Array.isArray(data.journey) || data.journey.length === 0) {
                alert('No journey data returned.');
                return;
            }

            // Helper function to extract latitude and longitude from a data row.
            function getLatLng(row) {
                return [parseFloat(row[11]), parseFloat(row[12])];
            }

            // Create a polyline representing the full journey and add it to the map.
            const journeyLatLngs = data.journey.map(getLatLng);
            const journeyLine = L.polyline(journeyLatLngs, {color: 'blue', weight: 4}).addTo(map);
            polylines.push(journeyLine);

            // Add markers for each node in the journey with color coding.
            data.journey.forEach((row, i) => {
                // Default marker color is red.
                let markerColor = 'red';

                // Start node marker is blue.
                if (i === 0) markerColor = 'blue';

                // Finish node marker is green.
                else if (i === data.journey.length - 1) markerColor = 'green';

                // Middle node (common root) marker is violet.
                if (i === Math.floor(data.journey.length / 2)) markerColor = 'violet';

                // Create a Leaflet marker with a colored icon.
                const marker = L.marker(getLatLng(row), {
                    icon: L.icon({
                        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(map)
                .bindPopup(`<b>Step ${i + 1}</b><br>${row[1]}`);

                // Store the marker for later removal.
                markers.push(marker);
            });

            // Adjust the map view to fit all journey points.
            map.fitBounds(L.latLngBounds(journeyLatLngs));

            // Render textual journey information below the map.
            renderPathInfo(data.journey);
        });
});

/**
 * Render the textual journey information in the UI.
 * Displays each step with labels for start, main hub, and destination.
 *
 * @param {Array} journey Array of journey nodes (rows).
 */
function renderPathInfo(journey) {
    const pathArea = document.getElementById('path-area');
    const savePathBtn = document.getElementById('save-path-btn');

    // Create a container div for the journey info.
    const journeyInfo = document.createElement('div');
    journeyInfo.style.marginTop = '20px'; // Add spacing above.

    if (!journey || journey.length === 0) {
        // Show error message if no journey data is available.
        journeyInfo.innerHTML = '<div style="color:red;">No journey data available.</div>';
    } else {
        // Helper function to format each step's display.
        function formatSite(row, stepNum, isStart, isCommonRoot, isDestination) {
            let label = `Step ${stepNum}:`;
            if (isStart) label += ' <span style="color:blue;">(Start)</span>';
            if (isCommonRoot) label += ' <span style="color:violet;">(Main Hub)</span>';
            if (isDestination) label += ' <span style="color:green;">(Destination)</span>';
            return `
            <div class="timeline-step">
                <span class="timeline-circle"></span>
                <div class="timeline-content">
                    <b>${label}</b> ${row[1]}<br>
                    <span style="font-size:0.95em;color:#555;">${row[7]}, ${row[8]} (${row[10]})</span>
                </div>
            </div>
            `;
        }

        // Calculate the index of the common root node (middle of the journey).
        const commonRootIndex = Math.floor(journey.length / 2);

        // Build the HTML for the journey timeline.
        let html = '<h3>Parcel Journey</h3>';
        html += '<div class="timeline">';
        journey.forEach((row, i) => {
            const isStart = i === 0;
            const isCommonRoot = i === commonRootIndex;
            const isDestination = i === journey.length - 1;
            html += formatSite(row, i + 1, isStart, isCommonRoot, isDestination);
        });
        html += '</div>';

        journeyInfo.innerHTML = html;
    }

    // Clear existing content and append the journey info and save button.
    pathArea.innerHTML = '';
    pathArea.appendChild(journeyInfo);
    pathArea.appendChild(savePathBtn);
}
//----------------------------------------------------------------------------------


// CSV TOGGLE ----------------------------------------------------------------------
// Old debug function to toggle display of top 20 root nodes on the map.

let csvMarkers = [];
let csvShown = false;

document.getElementById('toggle-csv').addEventListener('click', function() {
    if (!csvShown) {
        // Fetch the root_nodes.csv file.
        fetch('../../DATA/LOCAL/root_nodes.csv')
            .then(r => r.text())
            .then(text => {
                // Split CSV text into rows, skipping the header.
                const rows = text.trim().split('\n').slice(1);

                // For each row, parse coordinates and add a marker.
                rows.forEach(row => {
                    const cols = row.split(',');

                    // Parse latitude and longitude from columns 11 and 12.
                    const lat = parseFloat(cols[11]);
                    const lng = parseFloat(cols[12]);

                    // Only add marker if coordinates are valid numbers.
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const marker = L.marker([lat, lng], {
                            icon: L.icon({
                                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34]
                            })
                        })
                        .addTo(map)
                        .bindPopup(`<b>${cols[1]}</b><br>${cols[7]} ${cols[8]}<br>${cols[10]}`);

                        csvMarkers.push(marker);
                    }
                });

                csvShown = true;
                this.textContent = 'Hide Top 20 Sites';
            });
    } else {
        // Remove all CSV markers from the map.
        csvMarkers.forEach(m => map.removeLayer(m));
        csvMarkers = [];
        csvShown = false;
        this.textContent = 'Show Top 20 Sites';
    }
});
//----------------------------------------------------------------------------------