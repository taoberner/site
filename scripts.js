const GTFS = {
  stops: [],
  stopTimes: [],
  trips: [],
  routes: []
};

// Charger les fichiers GTFS
async function loadGTFS() {
  GTFS.stops = await loadCSV("gtfs/stops.txt");
  GTFS.stopTimes = await loadCSV("gtfs/stop_times.txt");
  GTFS.trips = await loadCSV("gtfs/trips.txt");
  GTFS.routes = await loadCSV("gtfs/routes.txt");

  console.log("GTFS chargé");
}

// Lire CSV
async function loadCSV(path) {
  const res = await fetch(path);
  const text = await res.text();

  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    let obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    return obj;
  });
}

// Trouver un stop par nom
function findStopByName(name) {
  return GTFS.stops.find(s =>
    s.stop_name.toLowerCase().includes(name.toLowerCase())
  );
}

// 🔥 RECHERCHE RÉELLE
async function lancerRecherche() {

  const fromInput = document.getElementById("inputFrom").value;
  const toInput = document.getElementById("inputTo").value;

  const fromStop = findStopByName(fromInput);
  const toStop = findStopByName(toInput);

  if (!fromStop || !toStop) {
    alert("Arrêt introuvable");
    return;
  }

  // Trouver trajets qui passent par les 2 stops
  const tripsFrom = GTFS.stopTimes.filter(st => st.stop_id === fromStop.stop_id);
  const tripsTo = GTFS.stopTimes.filter(st => st.stop_id === toStop.stop_id);

  let trajet = null;

  tripsFrom.forEach(f => {
    tripsTo.forEach(t => {
      if (f.trip_id === t.trip_id && f.stop_sequence < t.stop_sequence) {
        trajet = {
          trip_id: f.trip_id,
          depart: f.departure_time,
          arrivee: t.arrival_time
        };
      }
    });
  });

  if (!trajet) {
    alert("Aucun trajet trouvé");
    return;
  }

  // Trouver ligne
  const trip = GTFS.trips.find(t => t.trip_id === trajet.trip_id);
  const route = GTFS.routes.find(r => r.route_id === trip.route_id);

  // Calcul durée
  function timeToMin(t) {
    const [h,m,s] = t.split(":");
    return parseInt(h)*60 + parseInt(m);
  }

  const duration = timeToMin(trajet.arrivee) - timeToMin(trajet.depart);

  const result = {
    durationMin: duration,
    walkMin: 2,
    transfers: 0,
    depTime: trajet.depart,
    arrTime: trajet.arrivee,
    co2Bus: 0.3,
    co2Car: 1.2,
    sections: [
      {
        type: "bus",
        time: trajet.depart,
        title: "🚌 Ligne " + route.route_short_name,
        desc: fromStop.stop_name
      },
      {
        type: "end",
        time: trajet.arrivee,
        title: "📍 Arrivée",
        desc: toStop.stop_name
      }
    ]
  };

  state.currentJourneys = [result];

  renderResults(
    [result],
    fromStop.stop_name,
    toStop.stop_name,
    new Date().toISOString().split('T')[0],
    trajet.depart
  );

  showPage("results");
}

// Charger au démarrage
window.addEventListener("DOMContentLoaded", loadGTFS);
