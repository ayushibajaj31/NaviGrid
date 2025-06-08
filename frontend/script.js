const map = L.map('map').setView([19.0760, 72.8777], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors'
}).addTo(map);

let currentRoute = [];
let destinationNode = '';
let startTime = null;
let baseTimeEstimate = 0;
let selectedCarpool = null;
let polyline = null;

let allNodes = [ "Andheri", "Bandra", "Dadar", "CST", "Powai", "Ghatkopar", "Worli", "Colaba", "BKC", "Chembur", "Thane",
"Lokhandwala", "Versova", "Juhu", "Santacruz", "Wadala", "Sion", "Mulund", "Bhandup", "Kanjurmarg", "Mahim", "Matunga",
"Prabhadevi", "CuffeParade", "NarimanPoint", "Kurla", "Vikhroli", "Nahur", "Govandi", "Mankhurd", "Vashi", "Sanpada",
"Nerul", "Belapur", "Kharghar", "Panvel", "Taloja", "Kalamboli", "Kamothe", "Marol", "SakiNaka", "Khar" ];

document.getElementById('route-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const start = document.getElementById('start').value.trim();
    const destination = document.getElementById('destination').value.trim();

    if (!allNodes.includes(start) || !allNodes.includes(destination)) {
        alert("Invalid start or destination.");
        return;
    }

    destinationNode = destination;
    startTime = new Date(); // start clock

    const res = await fetch('http://localhost:3000/api/init-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, start, destination })
    });

    const data = await res.json();
    currentRoute = data.path;
    baseTimeEstimate = data.time;

    showRouteOnMap(data.route);
    document.getElementById('time-info').innerHTML = `<strong>Estimated Time:</strong> ${data.time} minutes`;

    if (data.carpoolMatches.length > 0) {
        const cp = data.carpoolMatches.map(p => `
            <label><input type="radio" name="carpool" value="${p.name}"> ${p.name} (${p.start} → ${p.destination})</label><br>
        `).join('');
        document.getElementById('carpool-options').innerHTML = `
            <h3>Carpool Options:</h3>
            ${cp}
            <button onclick="confirmCarpool()">Confirm Carpool</button>
        `;
    } else {
        document.getElementById('carpool-options').innerHTML = "<p>No carpool options available.</p>";
    }
});

function confirmCarpool() {
    const selected = document.querySelector('input[name="carpool"]:checked');
    if (selected) {
        selectedCarpool = selected.value;
        document.getElementById('carpool-options').innerHTML =
            `<p>✅ You chose to carpool with <strong>${selectedCarpool}</strong>.</p>`;
    } else {
        document.getElementById('carpool-options').innerHTML =
            `<p>❌ You chose not to carpool.</p>`;
    }
}

document.getElementById('update-location').addEventListener('click', async () => {
    const current = document.getElementById('current-location').value.trim();

    if (!allNodes.includes(current)) {
        document.getElementById('result').innerHTML = `<p style="color:red;">❌ Invalid location entered.</p>`;
        return;
    }

    if (current === destinationNode) {
        const endTime = new Date();
        const realTime = Math.round((endTime - startTime) / 1000); // in minutes
        document.getElementById('result').innerHTML = `
            <p style="color:green;">🎉 Trip Completed!</p>
            <p>🕓 Real Time Taken: ${realTime} minutes</p>
            <p>🕞 Estimated Time: ${baseTimeEstimate} minutes</p>
        `;
        return;
    }

    const res = await fetch('http://localhost:3000/api/update-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, destination: destinationNode })
    });

    const data = await res.json();
    if (!data.success) {
        document.getElementById('result').innerHTML = `<p style="color:red;">⚠️ No route due to traffic!</p>`;
        return;
    }

    const routeText = data.path.join(" → ");
    showRouteOnMap(data.route);

    document.getElementById('result').innerHTML = `
        <strong>${data.message}</strong><br>
        🧭 <strong>Route:</strong> ${routeText}<br>
        🕓 <strong>Time:</strong> ${data.time} minutes
    `;
});

function showRouteOnMap(route) {
    const latlngs = route.map(p => [p.lat, p.lng]);
    if (polyline) polyline.remove(); // remove old route
    polyline = L.polyline(latlngs, { color: 'blue' }).addTo(map);
    map.fitBounds(latlngs);
}
