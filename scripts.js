let stops = [];
let routes = [];
let trips = [];
let stopTimes = [];
let ready = false;

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] ?? "";
    });
    return obj;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

async function loadFile(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Erreur chargement ${path} : ${response.status}`);
  }
  const text = await response.text();
  return parseCSV(text);
}

async function loadGTFS() {
  const status = document.getElementById("status");

  try {
    status.innerHTML = "Chargement de <strong>stops.txt</strong>...";
    stops = await loadFile("./gtfs/stops.txt");

    status.innerHTML = "Chargement de <strong>routes.txt</strong>...";
    routes = await loadFile("./gtfs/routes.txt");

    status.innerHTML = "Chargement de <strong>trips.txt</strong>...";
    trips = await loadFile("./gtfs/trips.txt");

    status.innerHTML = "Chargement de <strong>stop_times.txt</strong>...";
    stopTimes = await loadFile("./gtfs/stop_times.txt");

    ready = true;
    status.innerHTML = `<span class="ok">✅ Données GTFS chargées</span> — ${stops.length} arrêts, ${routes.length} lignes, ${trips.length} trajets`;
    console.log("GTFS chargé");
  } catch (error) {
    console.error(error);
    status.innerHTML = `<span class="error">❌ Erreur de chargement :</span> ${error.message}`;
  }
}

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function findStopsByName(query) {
  const q = normalize(query);
  if (!q) return [];

  return stops.filter(stop =>
    normalize(stop.stop_name).includes(q)
  );
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

function estimateDuration(distanceKm) {
  const avgSpeedKmH = 25;
  return Math.round((distanceKm / avgSpeedKmH) * 60);
}

function getTripsForStop(stopId) {
  const relatedStopTimes = stopTimes.filter(st => st.stop_id === stopId);
  const tripIds = [...new Set(relatedStopTimes.map(st => st.trip_id))];
  return trips.filter(trip => tripIds.includes(trip.trip_id));
}

function getRouteNamesForStop(stopId) {
  const relatedTrips = getTripsForStop(stopId);
  const routeIds = [...new Set(relatedTrips.map(t => t.route_id))];

  return routes
    .filter(route => routeIds.includes(route.route_id))
    .map(route => ({
      id: route.route_id,
      shortName: route.route_short_name || "",
      longName: route.route_long_name || ""
    }));
}

function findCommonRoutes(stopId1, stopId2) {
  const routes1 = getRouteNamesForStop(stopId1).map(r => r.id);
  const routes2 = getRouteNamesForStop(stopId2).map(r => r.id);
  const commonIds = routes1.filter(id => routes2.includes(id));

  return routes.filter(r => commonIds.includes(r.route_id));
}

function pickBestStop(matches, originalText) {
  if (!matches.length) return null;

  const exact = matches.find(
    stop => normalize(stop.stop_name) === normalize(originalText)
  );
  if (exact) return exact;

  return matches[0];
}

function renderResult(html) {
  document.getElementById("result").innerHTML = html;
}

function findRoute() {
  if (!ready) {
    alert("⏳ Les données sont encore en cours de chargement.");
    return;
  }

  const fromInput = document.getElementById("from").value.trim();
  const toInput = document.getElementById("to").value.trim();

  if (!fromInput || !toInput) {
    renderResult(`
      <div class="result-title">Résultat :</div>
      <div class="line">⚠️ Merci de remplir le départ et l'arrivée.</div>
    `);
    return;
  }

  const fromMatches = findStopsByName(fromInput);
  const toMatches = findStopsByName(toInput);

  const fromStop = pickBestStop(fromMatches, fromInput);
  const toStop = pickBestStop(toMatches, toInput);

  if (!fromStop || !toStop) {
    renderResult(`
      <div class="result-title">Résultat :</div>
      <div class="line">❌ Arrêt introuvable.</div>
      <div class="small">Départ trouvé : ${fromMatches.length} correspondance(s)</div>
      <div class="small">Arrivée trouvée : ${toMatches.length} correspondance(s)</div>
    `);
    return;
  }

  const lat1 = parseFloat(fromStop.stop_lat);
  const lon1 = parseFloat(fromStop.stop_lon);
  const lat2 = parseFloat(toStop.stop_lat);
  const lon2 = parseFloat(toStop.stop_lon);

  if ([lat1, lon1, lat2, lon2].some(v => Number.isNaN(v))) {
    renderResult(`
      <div class="result-title">Résultat :</div>
      <div class="line">❌ Coordonnées invalides dans les données GTFS.</div>
    `);
    return;
  }

  const distance = haversine(lat1, lon1, lat2, lon2);
  const duration = estimateDuration(distance);
  const commonRoutes = findCommonRoutes(fromStop.stop_id, toStop.stop_id);

  renderResult(`
    <div class="result-title">Résultat :</div>

    <div class="line">🛑 <strong>${fromStop.stop_name}</strong></div>
    <div class="line">➡️ <strong>${toStop.stop_name}</strong></div>

    <div class="line">📏 Distance estimée : <strong>${distance.toFixed(2)} km</strong></div>
    <div class="line">⏱️ Durée estimée : <strong>${duration} min</strong></div>

    ${
      commonRoutes.length
        ? `
          <div class="line">🚌 Ligne(s) commune(s) possible(s) :</div>
          ${commonRoutes
            .slice(0, 5)
            .map(route => `
              <div class="line">
                • <strong>${route.route_short_name || "Sans numéro"}</strong>
                ${route.route_long_name ? `— ${route.route_long_name}` : ""}
              </div>
            `)
            .join("")}
        `
        : `
          <div class="line">🔄 Aucune ligne directe détectée entre ces deux arrêts.</div>
          <div class="small">Il faudra probablement une ou plusieurs correspondances.</div>
        `
    }

    <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;" />

    <div class="small">stop_id départ : ${fromStop.stop_id}</div>
    <div class="small">stop_id arrivée : ${toStop.stop_id}</div>
  `);
}

window.findRoute = findRoute;
loadGTFS();
