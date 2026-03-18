let stops = [];
let stopTimes = [];
let trips = [];
let routes = [];

async function loadGTFS() {
  stops = await loadFile("gtfs/stops.txt");
  stopTimes = await loadFile("gtfs/stop_times.txt");
  trips = await loadFile("gtfs/trips.txt");
  routes = await loadFile("gtfs/routes.txt");

  console.log("✅ GTFS chargé");
}

async function loadFile(path) {
  const text = await fetch(path).then(r => r.text());
  return parseCSV(text);
}

function parseCSV(text) {
  const lines = text.split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    let obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    return obj;
  });
}

loadGTFS();


// 🔍 TROUVER UN ARRET PAR NOM
function findStopsByName(name) {
  return stops.filter(s =>
    s.stop_name &&
    s.stop_name.toLowerCase().includes(name.toLowerCase())
  );
}


// 🚀 TROUVER TRAJET
function findRoute() {
  const fromInput = document.getElementById("from").value;
  const toInput = document.getElementById("to").value;

  const fromStops = findStopsByName(fromInput);
  const toStops = findStopsByName(toInput);

  if (fromStops.length === 0 || toStops.length === 0) {
    document.getElementById("result").innerHTML = "❌ Arrêt non trouvé";
    return;
  }

  const fromId = fromStops[0].stop_id;
  const toId = toStops[0].stop_id;

  // trouver trips contenant les 2 arrêts
  let possibleTrips = [];

  stopTimes.forEach(st => {
    if (st.stop_id === fromId) {
      const tripId = st.trip_id;

      const sameTripStops = stopTimes.filter(x => x.trip_id === tripId);

      const hasDestination = sameTripStops.find(x => x.stop_id === toId);

      if (hasDestination) {
        possibleTrips.push(tripId);
      }
    }
  });

  if (possibleTrips.length === 0) {
    document.getElementById("result").innerHTML = "❌ Aucun trajet direct trouvé";
    return;
  }

  const trip = trips.find(t => t.trip_id === possibleTrips[0]);
  const route = routes.find(r => r.route_id === trip.route_id);

  displayResult(fromStops[0], toStops[0], route);
}


// 🎯 AFFICHAGE
function displayResult(from, to, route) {
  const distance = calcDistance(
    from.stop_lat, from.stop_lon,
    to.stop_lat, to.stop_lon
  );

  const duration = Math.round(distance * 3); // estimation

  document.getElementById("result").innerHTML = `
    <h2>Résultat :</h2>
    <p>📍 ${from.stop_name}</p>
    <p>➡️ ${to.stop_name}</p>
    <p>🚌 Ligne : ${route.route_short_name || route.route_long_name}</p>
    <p>📏 Distance : ${distance.toFixed(2)} km</p>
    <p>⏱️ Durée estimée : ${duration} min</p>
  `;
}


// 📏 DISTANCE GPS
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
