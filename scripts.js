let STOPS = [];

// Charger les données
async function loadData() {
  try {
    const res = await fetch("data/arrets-du-reseau-lio.json");
    STOPS = await res.json();

    console.log("✅ Stops chargés :", STOPS.length);
  } catch (error) {
    console.error("❌ Erreur chargement JSON :", error);
  }
}

loadData();

// Trouver un arrêt
function findStop(name) {
  return STOPS.find(s =>
    s.stop_name.toLowerCase().includes(name.toLowerCase())
  );
}

// Calcul distance GPS
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Lancer recherche
function lancerRecherche() {
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;

  const stop1 = findStop(from);
  const stop2 = findStop(to);

  if (!stop1 || !stop2) {
    document.getElementById("result").innerHTML =
      "❌ Arrêt non trouvé";
    return;
  }

  const dist = distance(
    stop1.stop_coordinates.lat,
    stop1.stop_coordinates.lon,
    stop2.stop_coordinates.lat,
    stop2.stop_coordinates.lon
  );

  const duration = Math.round(dist * 4);

  document.getElementById("result").innerHTML = `
    <h3>Résultat :</h3>
    <p>🚏 <b>${stop1.stop_name}</b></p>
    <p>➡️ <b>${stop2.stop_name}</b></p>
    <p>📏 Distance : ${dist.toFixed(2)} km</p>
    <p>⏱️ Durée estimée : ${duration} min</p>
  `;
}
