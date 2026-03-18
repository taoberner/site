/* =============================================================
   liO Smart Move — scripts.js
   GTFS complet : itinéraires, horaires, carte réseau, CO2
   ============================================================= */

// ── ÉTAT GLOBAL ────────────────────────────────────────────────
const state = {
  loaded: false,
  loading: false,
  stops: {},           // stop_id → {id, name, lat, lon}
  stopsByName: [],     // tableau trié pour autocomplete
  routes: {},          // route_id → {shortName, longName, color, textColor, type}
  trips: {},           // trip_id → {routeId, serviceId, headsign}
  stopTimes: {},       // trip_id → [{stopId, arrivalSec, departureSec, seq}]
  stopToTrips: {},     // stop_id → Set<trip_id>
  routeToStops: {},    // route_id → Set<stop_id>
  calendar: {},        // service_id → {days, startDate, endDate}
  calendarDates: {},   // service_id → {date: 'added'|'removed'}
  currentJourneys: [],
  fromStop: null,
  toStop: null,
  selectedProfile: 'standard',
  map: null,
  mapInitialized: false,
  mapLayers: { route: [], markers: [], network: [] },
  networkVisible: false
};

const GTFS_PATH = 'gtfs/';
const CO2_BUS = 89;    // g/km
const CO2_CAR = 193;   // g/km
// Couleurs par type de ligne GTFS (route_type)
const ROUTE_TYPE_COLORS = { 0:'#e74c3c', 1:'#3498db', 2:'#2ecc71', 3:'#5b8fff', 4:'#9b59b6', 700:'#5b8fff' };

// ── NAVIGATION ─────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navMap = { home:'nav-home', search:'nav-search', results:'nav-search',
                   horaires:'nav-horaires', map:'nav-map', access:'nav-access', about:'nav-about' };
  const el = document.getElementById(navMap[id]);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
  if (id === 'map') setTimeout(initMap, 80);
}

function showNotif(msg, type = '') {
  const n = document.createElement('div');
  n.className = 'notif' + (type ? ' ' + type : '');
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 4500);
}

// ── CHARGEMENT GTFS ────────────────────────────────────────────
async function loadGTFS() {
  if (state.loaded || state.loading) return;
  state.loading = true;

  const loader  = document.getElementById('dataLoader');
  const fill    = document.getElementById('dataLoaderFill');
  const pctEl   = document.getElementById('dataLoaderPct');
  const txtEl   = document.getElementById('dataLoaderText');
  loader.classList.add('visible');

  const setP = (p, label) => {
    fill.style.width = p + '%';
    pctEl.textContent = p + '%';
    if (label) txtEl.textContent = label;
  };

  const files = [
    { file: 'stops.txt',          label: '📍 Arrêts…',      weight: 15, fn: parseStops },
    { file: 'routes.txt',         label: '🛣️ Lignes…',      weight: 10, fn: parseRoutes },
    { file: 'trips.txt',          label: '📅 Voyages…',     weight: 15, fn: parseTrips },
    { file: 'calendar.txt',       label: '📆 Calendrier…',  weight: 5,  fn: parseCalendar,      optional: true },
    { file: 'calendar_dates.txt', label: '📆 Exceptions…',  weight: 5,  fn: parseCalendarDates, optional: true },
    { file: 'stop_times.txt',     label: '⏱️ Horaires…',   weight: 50, fn: parseStopTimes }
  ];

  let progress = 0;
  try {
    for (const f of files) {
      setP(progress, '📡 Chargement ' + f.label);
      try {
        const raw = await fetchGTFS(f.file);
        f.fn(raw);
      } catch (e) {
        if (!f.optional) throw e;
      }
      progress += f.weight;
      setP(progress);
    }

    buildRouteToStops();
    state.loaded = true;

    // Mise à jour stats accueil
    setP(100, '✅ Données liO chargées !');
    updateStats();
    setTimeout(() => loader.classList.remove('visible'), 1800);
    showNotif('✅ ' + formatN(Object.keys(state.stops).length) + ' arrêts · ' +
              formatN(Object.keys(state.routes).length) + ' lignes chargés', 'green');
  } catch (err) {
    console.error('GTFS load error:', err);
    loader.classList.remove('visible');
    showNotif('❌ Erreur chargement GTFS — vérifiez le dossier gtfs/', 'red');
    ['stat-stops','stat-routes','stat-trips','stat-times'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = 'N/A'; el.style.color = 'var(--red-soft)'; }
    });
  }
  state.loading = false;
}

async function fetchGTFS(filename) {
  const r = await fetch(GTFS_PATH + filename + '?_=' + Date.now());
  if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + filename);
  return r.text();
}

function updateStats() {
  const nTimes = Object.values(state.stopTimes).reduce((a,b) => a + b.length, 0);
  [
    ['stat-stops',  Object.keys(state.stops).length],
    ['stat-routes', Object.keys(state.routes).length],
    ['stat-trips',  Object.keys(state.trips).length],
    ['stat-times',  nTimes]
  ].forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = formatN(val); el.classList.remove('loading'); }
  });
}

// ── PARSEURS ───────────────────────────────────────────────────
function parseCSV(raw) {
  const lines = raw.replace(/\r/g, '').split('\n');
  const headers = csvLine(lines[0]).map(h => h.replace(/^\uFEFF/, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const v = csvLine(lines[i]);
    if (!v.length || (v.length === 1 && !v[0])) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = (v[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function csvLine(line) {
  const res = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQ = !inQ;
    else if (c === ',' && !inQ) { res.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  res.push(cur.trim());
  return res;
}

function parseStops(raw) {
  parseCSV(raw).forEach(r => {
    if (!r.stop_id) return;
    state.stops[r.stop_id] = {
      id: r.stop_id,
      name: r.stop_name || r.stop_id,
      lat: parseFloat(r.stop_lat) || 0,
      lon: parseFloat(r.stop_lon) || 0
    };
  });
  state.stopsByName = Object.values(state.stops)
    .filter(s => s.lat && s.lon)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

function parseRoutes(raw) {
  parseCSV(raw).forEach(r => {
    state.routes[r.route_id] = {
      shortName:  r.route_short_name  || r.route_id,
      longName:   r.route_long_name   || '',
      color:      r.route_color       ? '#' + r.route_color      : null,
      textColor:  r.route_text_color  ? '#' + r.route_text_color : '#ffffff',
      type:       parseInt(r.route_type) || 3
    };
  });
}

function parseTrips(raw) {
  parseCSV(raw).forEach(r => {
    state.trips[r.trip_id] = {
      routeId:   r.route_id,
      serviceId: r.service_id,
      headsign:  r.trip_headsign || ''
    };
  });
}

function parseCalendar(raw) {
  parseCSV(raw).forEach(r => {
    state.calendar[r.service_id] = {
      days: [r.sunday,r.monday,r.tuesday,r.wednesday,r.thursday,r.friday,r.saturday].map(d => d === '1'),
      startDate: r.start_date || '',
      endDate:   r.end_date   || ''
    };
  });
}

function parseCalendarDates(raw) {
  parseCSV(raw).forEach(r => {
    if (!state.calendarDates[r.service_id]) state.calendarDates[r.service_id] = {};
    state.calendarDates[r.service_id][r.date] = r.exception_type === '1' ? 'added' : 'removed';
  });
}

function parseStopTimes(raw) {
  parseCSV(raw).forEach(r => {
    if (!r.trip_id) return;
    if (!state.stopTimes[r.trip_id]) state.stopTimes[r.trip_id] = [];
    state.stopTimes[r.trip_id].push({
      stopId:       r.stop_id,
      arrivalSec:   timeToSec(r.arrival_time),
      departureSec: timeToSec(r.departure_time),
      seq:          parseInt(r.stop_sequence) || 0
    });
    if (!state.stopToTrips[r.stop_id]) state.stopToTrips[r.stop_id] = new Set();
    state.stopToTrips[r.stop_id].add(r.trip_id);
  });
  Object.values(state.stopTimes).forEach(arr => arr.sort((a, b) => a.seq - b.seq));
}

function buildRouteToStops() {
  Object.entries(state.trips).forEach(([tripId, trip]) => {
    const times = state.stopTimes[tripId];
    if (!times) return;
    if (!state.routeToStops[trip.routeId]) state.routeToStops[trip.routeId] = new Set();
    times.forEach(t => state.routeToStops[trip.routeId].add(t.stopId));
  });
}

// ── UTILS ──────────────────────────────────────────────────────
function timeToSec(t) {
  if (!t) return 0;
  const p = t.split(':').map(Number);
  return p[0] * 3600 + (p[1] || 0) * 60 + (p[2] || 0);
}
function secToTime(s) {
  return String(Math.floor(s / 3600) % 24).padStart(2,'0') + ':' + String(Math.floor((s % 3600) / 60)).padStart(2,'0');
}
function formatN(n) { return n.toLocaleString('fr-FR'); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return String(s).replace(/'/g,"\\'"); }
function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

function isServiceActive(serviceId, dateStr) {
  const ex = state.calendarDates[serviceId] || {};
  if (ex[dateStr] === 'added')   return true;
  if (ex[dateStr] === 'removed') return false;
  const cal = state.calendar[serviceId];
  if (!cal) return true;
  if (dateStr < cal.startDate || dateStr > cal.endDate) return false;
  const [y, mo, d] = [+dateStr.slice(0,4), +dateStr.slice(4,6)-1, +dateStr.slice(6,8)];
  return cal.days[new Date(y, mo, d).getDay()];
}

function estimateDist(a, b) {
  if (!a || !b) return 5;
  const dl = b.lat - a.lat, dln = b.lon - a.lon;
  return Math.max(0.5, Math.round(Math.sqrt(dl*dl + dln*dln) * 111 * 10) / 10);
}
function co2(distKm, gPerKm) { return Math.round(distKm * gPerKm) / 1000; }

// ── AUTOCOMPLETE ───────────────────────────────────────────────
function searchStops(q, limit = 10) {
  if (!q || q.length < 2) return [];
  const qn = norm(q);
  return state.stopsByName
    .map(s => {
      const n = norm(s.name);
      const score = n === qn ? 3 : n.startsWith(qn) ? 2 : n.includes(qn) ? 1 : 0;
      return { ...s, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'fr'))
    .slice(0, limit);
}

function renderAcList(listEl, results, onSelect) {
  if (!results.length) { listEl.style.display = 'none'; return; }
  listEl.innerHTML = results.map(r =>
    `<div class="autocomplete-item" onclick="${onSelect(r)}">
       <div class="ac-name">🚌 ${esc(r.name)}</div>
       <div class="ac-detail">${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}</div>
     </div>`
  ).join('');
  listEl.style.display = 'block';
}

function doAutocomplete(input, side) {
  if (!state.loaded) { if (!state.loading) loadGTFS(); return; }
  renderAcList(
    document.getElementById('ac-' + side),
    searchStops(input.value),
    r => `selectStop('${side}','${escAttr(r.id)}','${escAttr(r.name)}',${r.lat},${r.lon})`
  );
}

function doAutocompleteHoraires(input) {
  if (!state.loaded) { if (!state.loading) loadGTFS(); return; }
  renderAcList(
    document.getElementById('ac-horaires'),
    searchStops(input.value),
    r => `selectStopH('${escAttr(r.id)}','${escAttr(r.name)}')`
  );
}

function selectStop(side, id, name, lat, lon) {
  const stop = { id, name, lat: +lat, lon: +lon };
  if (side === 'from') { state.fromStop = stop; document.getElementById('inputFrom').value = name; }
  else                 { state.toStop   = stop; document.getElementById('inputTo').value   = name; }
  document.getElementById('ac-' + side).style.display = 'none';
}

function selectStopH(id, name) {
  const el = document.getElementById('horairesStop');
  el.value = name; el.dataset.stopId = id;
  document.getElementById('ac-horaires').style.display = 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.form-group') && !e.target.closest('.stop-selector'))
    document.querySelectorAll('.autocomplete-list').forEach(l => l.style.display = 'none');
});

// ── CHIPS / PROFIL ─────────────────────────────────────────────
function toggleChip(el) { el.classList.toggle('selected'); }
function selectProfile(el) {
  document.querySelectorAll('#profiles .profile-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedProfile = el.dataset.profile;
}

// ── ALGORITHME ITINÉRAIRE ──────────────────────────────────────
async function lancerRecherche() {
  if (!state.loaded) {
    if (!state.loading) loadGTFS();
    showNotif('⏳ Données encore en chargement, patientez…'); return;
  }

  const fromText = document.getElementById('inputFrom').value.trim();
  const toText   = document.getElementById('inputTo').value.trim();
  if (!fromText || !toText) { showNotif('⚠️ Renseignez un départ et une arrivée.'); return; }

  // Résolution arrêts
  if (!state.fromStop || norm(state.fromStop.name) !== norm(fromText)) {
    const r = searchStops(fromText, 1);
    if (!r.length) { showNotif('❌ Arrêt introuvable : ' + fromText); return; }
    state.fromStop = r[0];
  }
  if (!state.toStop || norm(state.toStop.name) !== norm(toText)) {
    const r = searchStops(toText, 1);
    if (!r.length) { showNotif('❌ Arrêt introuvable : ' + toText); return; }
    state.toStop = r[0];
  }
  if (state.fromStop.id === state.toStop.id) { showNotif('⚠️ Départ et arrivée identiques.'); return; }

  const date = document.getElementById('inputDate').value;
  const time = document.getElementById('inputTime').value;
  if (!date) { showNotif('⚠️ Choisissez une date.'); return; }

  setLoading(true, 'Calcul de l\'itinéraire…', 'Analyse des horaires GTFS');

  setTimeout(() => {
    try {
      const dateStr = date.replace(/-/g, '');
      const depSec  = timeToSec(time + ':00');
      let journeys  = findJourneys(state.fromStop.id, state.toStop.id, depSec, dateStr);
      journeys = applyProfile(journeys, state.selectedProfile);
      state.currentJourneys = journeys;
      setLoading(false);
      renderResults(journeys, state.fromStop.name, state.toStop.name, date, time);
      showPage('results');
    } catch(e) {
      console.error(e);
      setLoading(false);
      showNotif('❌ Erreur recherche : ' + e.message, 'red');
    }
  }, 60);
}

function setLoading(on, txt, sub) {
  const ov  = document.getElementById('loading');
  const bar = document.getElementById('loadingBar');
  if (on) {
    ov.classList.add('active');
    if (txt) document.getElementById('loadingText').textContent = txt;
    if (sub) document.getElementById('loadingSub').textContent  = sub;
    bar.style.width = '0%';
    let p = 0;
    clearInterval(bar._t);
    bar._t = setInterval(() => { p = Math.min(p + Math.random() * 12, 90); bar.style.width = p + '%'; }, 200);
  } else {
    clearInterval(bar._t);
    bar.style.width = '100%';
    setTimeout(() => ov.classList.remove('active'), 350);
  }
}

function findJourneys(fromId, toId, depSec, dateStr) {
  const direct   = findDirect(fromId, toId, depSec, dateStr);
  const transfer = direct.length < 3 ? findWithTransfer(fromId, toId, depSec, dateStr, 3 - direct.length) : [];
  return [...direct, ...transfer].sort((a, b) => a.arrivalSec - b.arrivalSec).slice(0, 4);
}

function findDirect(fromId, toId, depSec, dateStr) {
  const fromT = state.stopToTrips[fromId];
  const toT   = state.stopToTrips[toId];
  if (!fromT || !toT) return [];
  const results = [];

  for (const tid of fromT) {
    if (!toT.has(tid)) continue;
    const trip = state.trips[tid];
    if (!trip || !isServiceActive(trip.serviceId, dateStr)) continue;
    const times = state.stopTimes[tid];
    if (!times) continue;
    const fe = times.find(t => t.stopId === fromId);
    const te = times.find(t => t.stopId === toId);
    if (!fe || !te || fe.seq >= te.seq) continue;
    if (fe.departureSec < depSec) continue;

    const route   = state.routes[trip.routeId] || {};
    const durMin  = Math.round((te.arrivalSec - fe.departureSec) / 60);
    const distKm  = estimateDist(state.stops[fromId], state.stops[toId]);
    const lineCol = route.color || ROUTE_TYPE_COLORS[route.type] || '#5b8fff';

    results.push({
      type: 'direct', transfers: 0,
      depTime: secToTime(fe.departureSec), arrTime: secToTime(te.arrivalSec),
      departureSec: fe.departureSec, arrivalSec: te.arrivalSec,
      durationMin: durMin, walkMin: 0, distKm,
      co2Bus: co2(distKm, CO2_BUS), co2Car: co2(distKm, CO2_CAR),
      routeNames: [route.shortName || trip.routeId],
      lineColors: [lineCol],
      stops: [fromId, toId],
      sections: [
        { type: 'bus', dotClass: '',
          time: secToTime(fe.departureSec),
          title: `🚌 Ligne ${route.shortName || trip.routeId}${trip.headsign ? ' → ' + trip.headsign : ''}`,
          desc:  `Depuis ${state.stops[fromId]?.name || fromId}`,
          badge: route.shortName, badgeColor: lineCol, duration: durMin },
        { type: 'end', dotClass: 'end',
          time: secToTime(te.arrivalSec),
          title: `📍 Arrivée — ${state.stops[toId]?.name || toId}`,
          desc: 'Destination atteinte', duration: 0 }
      ]
    });
    if (results.length >= 8) break;
  }
  return results.sort((a,b) => a.departureSec - b.departureSec).slice(0, 4);
}

function findWithTransfer(fromId, toId, depSec, dateStr, maxRes) {
  const fromT = state.stopToTrips[fromId];
  const toT   = state.stopToTrips[toId];
  if (!fromT || !toT) return [];
  const results = [];

  outer:
  for (const t1Id of fromT) {
    const trip1 = state.trips[t1Id];
    if (!trip1 || !isServiceActive(trip1.serviceId, dateStr)) continue;
    const times1 = state.stopTimes[t1Id];
    if (!times1) continue;
    const fe = times1.find(t => t.stopId === fromId);
    if (!fe || fe.departureSec < depSec) continue;

    const nextStops = times1.filter(t => t.seq > fe.seq);
    for (const midE of nextStops) {
      const midId = midE.stopId;
      if (!state.stopToTrips[midId]) continue;

      for (const t2Id of state.stopToTrips[midId]) {
        if (!toT.has(t2Id) || t2Id === t1Id) continue;
        const trip2 = state.trips[t2Id];
        if (!trip2 || !isServiceActive(trip2.serviceId, dateStr)) continue;
        const times2 = state.stopTimes[t2Id];
        if (!times2) continue;
        const midE2 = times2.find(t => t.stopId === midId);
        const te    = times2.find(t => t.stopId === toId);
        if (!midE2 || !te || midE2.seq >= te.seq) continue;
        if (midE2.departureSec < midE.arrivalSec + 120) continue;

        const route1 = state.routes[trip1.routeId] || {};
        const route2 = state.routes[trip2.routeId] || {};
        const wait   = Math.round((midE2.departureSec - midE.arrivalSec) / 60);
        const durMin = Math.round((te.arrivalSec - fe.departureSec) / 60);
        const distKm = estimateDist(state.stops[fromId], state.stops[toId]);
        const col1   = route1.color || '#5b8fff';
        const col2   = route2.color || '#5b8fff';

        results.push({
          type: 'transfer', transfers: 1,
          depTime: secToTime(fe.departureSec), arrTime: secToTime(te.arrivalSec),
          departureSec: fe.departureSec, arrivalSec: te.arrivalSec,
          durationMin: durMin, walkMin: 3, distKm,
          co2Bus: co2(distKm, CO2_BUS), co2Car: co2(distKm, CO2_CAR),
          routeNames: [route1.shortName || trip1.routeId, route2.shortName || trip2.routeId],
          lineColors: [col1, col2],
          stops: [fromId, midId, toId],
          sections: [
            { type: 'bus', dotClass: '',
              time: secToTime(fe.departureSec),
              title: `🚌 Ligne ${route1.shortName || trip1.routeId}${trip1.headsign ? ' → ' + trip1.headsign : ''}`,
              desc:  `Depuis ${state.stops[fromId]?.name || fromId}`,
              badge: route1.shortName, badgeColor: col1,
              duration: Math.round((midE.arrivalSec - fe.departureSec) / 60) },
            { type: 'transfer', dotClass: 'walk',
              time: secToTime(midE.arrivalSec),
              title: `🔄 Correspondance — ${state.stops[midId]?.name || midId}`,
              desc: `Attente ${wait} min · Ligne ${route2.shortName || trip2.routeId}`,
              duration: wait },
            { type: 'bus', dotClass: '',
              time: secToTime(midE2.departureSec),
              title: `🚌 Ligne ${route2.shortName || trip2.routeId}${trip2.headsign ? ' → ' + trip2.headsign : ''}`,
              desc: `Vers ${state.stops[toId]?.name || toId}`,
              badge: route2.shortName, badgeColor: col2,
              duration: Math.round((te.arrivalSec - midE2.departureSec) / 60) },
            { type: 'end', dotClass: 'end',
              time: secToTime(te.arrivalSec),
              title: `📍 Arrivée — ${state.stops[toId]?.name || toId}`,
              desc: 'Destination atteinte', duration: 0 }
          ]
        });
        if (results.length >= maxRes * 3) break outer;
        break;
      }
    }
  }
  return results.sort((a,b) => a.departureSec - b.departureSec).slice(0, maxRes);
}

function applyProfile(journeys, profile) {
  const j = [...journeys];
  switch(profile) {
    case 'pmr': case 'senior': return j.sort((a,b) => a.transfers - b.transfers || a.durationMin - b.durationMin);
    case 'eco': return j.sort((a,b) => a.co2Bus - b.co2Bus);
    case 'etudiant': return j.sort((a,b) => a.durationMin - b.durationMin);
    default: return j;
  }
}

// ── RENDU RÉSULTATS ────────────────────────────────────────────
function renderResults(journeys, fromName, toName, date, time) {
  const df = new Date(date).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  document.getElementById('resultsRoute').textContent = `${fromName} → ${toName} · ${df} · ${time}`;

  if (!journeys.length) {
    document.getElementById('resultsContent').innerHTML = `
      <div class="no-result">
        <div class="no-icon">🔍</div>
        <h2>Aucun itinéraire trouvé</h2>
        <p>Essayez une heure différente ou vérifiez que votre date est dans la plage de validité du réseau.</p>
        <button class="btn btn-primary" style="margin-top:20px" onclick="showPage('search')">← Modifier</button>
      </div>`; return;
  }

  const main = journeys[0];
  const alts = journeys.slice(1);
  const co2Saved = Math.max(0, main.co2Car - main.co2Bus).toFixed(2);

  const tlHTML = main.sections.map((s, i) => {
    const isLast = i === main.sections.length - 1;
    const badgeHTML = s.badge
      ? `<span style="display:inline-block;padding:2px 8px;border-radius:5px;font-size:0.72rem;font-weight:700;background:${s.badgeColor||'#5b8fff'};color:#fff;margin-left:6px">${esc(s.badge)}</span>`
      : '';
    return `<div class="tl-item">
      <div class="tl-left">
        <div class="tl-dot ${s.dotClass || ''}"></div>
        ${!isLast ? '<div class="tl-line"></div>' : ''}
      </div>
      <div class="tl-content">
        <h4>${esc(s.title)}${badgeHTML}</h4>
        <p>${esc(s.desc)}</p>
        <span class="tl-time">${s.time}</span>
      </div>
    </div>`;
  }).join('');

  const altsHTML = alts.map((j, idx) => {
    const faster = j.durationMin < main.durationMin;
    const diff   = Math.abs(j.durationMin - main.durationMin);
    const badge  = faster ? `−${diff} min` : (diff ? `+${diff} min` : '=');
    const cls    = j.transfers === 0 ? 'tag-fast' : 'tag-acc';
    const label  = j.transfers === 0 ? '🚀 Direct' : '🔄 Correspondance';
    const linesHTML = (j.routeNames || []).map((n, li) =>
      `<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:0.72rem;font-weight:700;background:${j.lineColors?.[li]||'#5b8fff'};color:#fff">${esc(n)}</span>`
    ).join(' ');
    return `<div class="alt-card" onclick="loadAlt(${idx+1})">
      <div class="alt-card-header"><h4>${label} ${linesHTML}</h4><span class="alt-tag ${cls}">${badge}</span></div>
      <div class="alt-stats"><span>🕐 ${j.durationMin} min</span><span>⏰ ${j.depTime}→${j.arrTime}</span><span>🔄 ${j.transfers} corresp.</span></div>
    </div>`;
  }).join('');

  const linesHTML = (main.routeNames || []).map((n, i) =>
    `<span style="display:inline-block;padding:2px 10px;border-radius:6px;font-size:0.8rem;font-weight:700;background:${main.lineColors?.[i]||'#5b8fff'};color:#fff;margin-right:4px">${esc(n)}</span>`
  ).join('');

  document.getElementById('resultsContent').innerHTML = `
    <div class="results-grid">
      <div>
        <div class="main-result">
          <div class="result-badge">⭐ Trajet recommandé · Données GTFS réelles</div>
          <div class="result-stats">
            <div class="stat-block"><div class="stat-val">${main.durationMin} min</div><div class="stat-label">Durée totale</div></div>
            <div class="stat-block"><div class="stat-val">${main.arrTime}</div><div class="stat-label">Arrivée</div></div>
            <div class="stat-block"><div class="stat-val">${main.transfers}</div><div class="stat-label">Corresp.</div></div>
            <div class="stat-block"><div class="stat-val">${main.distKm} km</div><div class="stat-label">Distance</div></div>
          </div>
          <div class="timeline">${tlHTML}</div>
          <div class="result-actions">
            <button class="btn btn-primary btn-sm" onclick="showPage('map')">🗺️ Carte</button>
            <button class="btn btn-secondary btn-sm" onclick="speakJourney()">🔊 Écouter</button>
            <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Imprimer</button>
            <button class="btn btn-ghost btn-sm" onclick="showPage('search')">🔍 Nouveau</button>
          </div>
        </div>
      </div>
      <div class="sidebar-results">
        <div class="why-box">
          <h3>Détails du trajet</h3>
          <div class="why-item">Lignes : ${linesHTML || 'N/A'}</div>
          <div class="why-item">Départ ${main.depTime} · Arrivée ${main.arrTime}</div>
          <div class="why-item">${main.transfers === 0 ? 'Trajet direct sans correspondance' : main.transfers + ' correspondance(s)'}</div>
          <div class="why-item">Distance estimée : ${main.distKm} km</div>
        </div>
        <div class="eco-box">
          <h3>🌿 Score écologique</h3>
          <div class="eco-compare">
            <div class="eco-col"><div class="eco-val green">${main.co2Bus} kg</div><p>CO₂ Bus</p></div>
            <div class="eco-divider">vs</div>
            <div class="eco-col"><div class="eco-val red">${main.co2Car} kg</div><p>CO₂ Voiture</p></div>
          </div>
          <div class="eco-saved">✅ ${co2Saved} kg CO₂ évités ce trajet</div>
        </div>
        ${alts.length ? `<div><p class="alt-title">Alternatives</p><div class="alt-cards">${altsHTML}</div></div>` : ''}
      </div>
    </div>`;
}

function loadAlt(idx) {
  const copy = [...state.currentJourneys];
  const alt  = copy.splice(idx, 1)[0];
  copy.unshift(alt);
  state.currentJourneys = copy;
  renderResults(copy, state.fromStop?.name || '—', state.toStop?.name || '—',
    document.getElementById('inputDate')?.value || '',
    document.getElementById('inputTime')?.value || '');
  window.scrollTo(0, 0);
}

function speakJourney() {
  if (!('speechSynthesis' in window)) { showNotif('❌ Synthèse vocale non disponible.'); return; }
  window.speechSynthesis.cancel();
  const j = state.currentJourneys[0];
  if (!j) return;
  const txt = `Itinéraire de ${state.fromStop?.name} vers ${state.toStop?.name}. `
    + `Départ à ${j.depTime}, arrivée à ${j.arrTime}, durée ${j.durationMin} minutes. `
    + j.sections.map(s => s.title.replace(/[🚌🚶🔄📍🚴⭐]/g, '')).join('. ');
  const u = new SpeechSynthesisUtterance(txt);
  u.lang = 'fr-FR';
  window.speechSynthesis.speak(u);
  showNotif('🔊 Lecture vocale en cours…');
}

// ── HORAIRES ───────────────────────────────────────────────────
function afficherHoraires() {
  if (!state.loaded) { if (!state.loading) loadGTFS(); showNotif('⏳ Données en cours de chargement…'); return; }

  const input  = document.getElementById('horairesStop');
  const dateEl = document.getElementById('horairesDate');
  const stopName = input.value.trim();
  const dateStr  = dateEl.value.replace(/-/g, '');
  if (!stopName) { showNotif('⚠️ Entrez un nom d\'arrêt.'); return; }
  if (!dateStr)  { showNotif('⚠️ Choisissez une date.');    return; }

  let stopId = input.dataset.stopId;
  if (!stopId || !state.stops[stopId]) {
    const r = searchStops(stopName, 1);
    if (!r.length) { showNotif('❌ Arrêt introuvable : ' + stopName); return; }
    stopId = r[0].id;
  }

  const trips = state.stopToTrips[stopId];
  if (!trips?.size) {
    document.getElementById('horairesResult').innerHTML = noResult('Aucun passage', 'Cet arrêt n\'a pas de données de passage.');
    return;
  }

  const rows = [];
  for (const tid of trips) {
    const trip = state.trips[tid];
    if (!trip || !isServiceActive(trip.serviceId, dateStr)) continue;
    const times = state.stopTimes[tid];
    if (!times) continue;
    const entry = times.find(t => t.stopId === stopId);
    if (!entry) continue;
    const route = state.routes[trip.routeId] || {};
    rows.push({
      depSec: entry.departureSec,
      time:   secToTime(entry.departureSec),
      ligne:  route.shortName || trip.routeId,
      color:  route.color || ROUTE_TYPE_COLORS[route.type] || '#5b8fff',
      dir:    trip.headsign || '—'
    });
  }

  rows.sort((a, b) => a.depSec - b.depSec);
  if (!rows.length) {
    document.getElementById('horairesResult').innerHTML = noResult('Aucun service ce jour', 'Pas de passage à cette date.');
    return;
  }

  const nowSec = new Date().getHours() * 3600 + new Date().getMinutes() * 60;
  let nextDone = false;
  const tbRows = rows.map(r => {
    let cls = r.depSec < nowSec ? 'past' : (!nextDone ? (nextDone = true, 'next') : '');
    const badgeStyle = `background:${r.color};color:#fff`;
    return `<tr>
      <td><span class="time-pill ${cls}">${r.time}</span></td>
      <td><span class="badge-ligne" style="${badgeStyle}">${esc(r.ligne)}</span></td>
      <td>${esc(r.dir)}</td>
    </tr>`;
  }).join('');

  const stopObj = state.stops[stopId];
  document.getElementById('horairesResult').innerHTML = `
    <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:16px">📍 ${esc(stopObj?.name || stopId)} — ${rows.length} passages</h2>
    <div class="horaires-table-wrap">
      <table class="horaires-table">
        <thead><tr><th>Heure</th><th>Ligne</th><th>Direction</th></tr></thead>
        <tbody>${tbRows}</tbody>
      </table>
    </div>`;
}

function noResult(title, sub) {
  return `<div class="no-result"><div class="no-icon">🕐</div><h2>${title}</h2><p>${sub}</p></div>`;
}

// ── CARTE LEAFLET ──────────────────────────────────────────────
function initMap() {
  const el = document.getElementById('leaflet-map');
  if (!el) return;

  if (!state.map) {
    const center = state.fromStop
      ? [state.fromStop.lat, state.fromStop.lon]
      : [43.6047, 3.8797]; // Montpellier par défaut
    state.map = L.map('leaflet-map').setView(center, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(state.map);
    state.mapInitialized = true;
  } else {
    state.map.invalidateSize();
  }

  if (state.currentJourneys.length && state.fromStop && state.toStop) {
    drawJourney(state.currentJourneys[0]);
  }
}

function drawJourney(journey) {
  if (!state.map) return;
  clearLayers('route'); clearLayers('markers');

  const from = state.fromStop, to = state.toStop;

  // Construire les coords via les arrêts réels du trajet
  const coords = buildCoords(journey);
  if (coords.length > 1) {
    const color = journey.lineColors?.[0] || '#1db37e';
    const poly = L.polyline(coords, { color, weight: 6, opacity: 0.9 }).addTo(state.map);
    state.mapLayers.route.push(poly);
    state.map.fitBounds(poly.getBounds(), { padding: [50, 50] });
  }

  // Marqueur départ
  const mF = L.marker([from.lat, from.lon], { icon: makeMarkerIcon('#1db37e', '📍') })
    .addTo(state.map).bindPopup(`<b>Départ</b><br>${esc(from.name)}`);
  state.mapLayers.markers.push(mF);

  // Marqueur arrivée
  const mT = L.marker([to.lat, to.lon], { icon: makeMarkerIcon('#0d1f1a', '🏁') })
    .addTo(state.map).bindPopup(`<b>Arrivée</b><br>${esc(to.name)}`);
  state.mapLayers.markers.push(mT);

  // Arrêts de correspondance
  (journey.stops || []).slice(1, -1).forEach(sid => {
    const s = state.stops[sid];
    if (!s?.lat) return;
    const cm = L.circleMarker([s.lat, s.lon], {
      radius: 8, color: '#fff', fillColor: '#f0a500', fillOpacity: 1, weight: 2
    }).addTo(state.map).bindPopup(`<b>Correspondance</b><br>${esc(s.name)}`);
    state.mapLayers.markers.push(cm);
  });

  updateMapSidebar(journey, from, to);
  document.getElementById('mapSubtitle').textContent = `${from.name} → ${to.name}`;
}

function buildCoords(journey) {
  const pts = [];
  const addStop = sid => { const s = state.stops[sid]; if (s?.lat) pts.push([s.lat, s.lon]); };
  (journey.stops || []).forEach(addStop);
  // Si pas de stops intermédiaires, juste from/to
  if (pts.length < 2) {
    if (state.fromStop) pts.unshift([state.fromStop.lat, state.fromStop.lon]);
    if (state.toStop)   pts.push([state.toStop.lat, state.toStop.lon]);
  }
  return pts;
}

function makeMarkerIcon(bg, emoji) {
  return L.divIcon({
    html: `<div style="background:${bg};color:white;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:15px">${emoji}</span></div>`,
    className: '', iconSize: [34, 34], iconAnchor: [17, 34]
  });
}

function updateMapSidebar(journey, from, to) {
  const info = document.getElementById('mapTrajetInfo');
  if (!info) return;
  const lines = (journey.routeNames || []).map((n, i) =>
    `<div class="map-info-item"><div class="map-dot" style="background:${journey.lineColors?.[i]||'#5b8fff'}"></div>Ligne ${esc(n)} · ${journey.durationMin} min</div>`
  ).join('');
  info.innerHTML = `
    <div class="map-info-item"><div class="map-dot" style="background:var(--green)"></div><strong>${esc(from.name)}</strong></div>
    ${lines}
    <div class="map-info-item"><div class="map-dot" style="background:var(--ink)"></div><strong>${esc(to.name)}</strong></div>`;
}

// Carte réseau : tous les arrêts
function toggleNetworkStops() {
  if (!state.map || !state.loaded) return;
  if (state.networkVisible) {
    clearLayers('network');
    state.networkVisible = false;
    document.getElementById('btnNetwork').textContent = '🗺️ Afficher tous les arrêts';
    return;
  }
  // Limiter à 2000 arrêts pour les perfs
  const stops = state.stopsByName.slice(0, 2000);
  const icon = L.divIcon({
    html: '<div style="width:6px;height:6px;background:#5b8fff;border-radius:50%;border:1px solid #fff"></div>',
    className: '', iconSize: [6,6], iconAnchor: [3,3]
  });
  stops.forEach(s => {
    const m = L.marker([s.lat, s.lon], { icon }).addTo(state.map)
      .bindPopup(`<b>${esc(s.name)}</b>`);
    state.mapLayers.network.push(m);
  });
  state.networkVisible = true;
  document.getElementById('btnNetwork').textContent = '🙈 Masquer les arrêts';
}

function clearLayers(key) {
  (state.mapLayers[key] || []).forEach(l => { try { state.map.removeLayer(l); } catch(e){} });
  state.mapLayers[key] = [];
}

function applyMapFilters() {
  if (!state.map) return;
  const showLignes  = document.getElementById('filterLignes').checked;
  const showMarche  = document.getElementById('filterMarche').checked;
  const showArrets  = document.getElementById('filterArrets').checked;
  state.mapLayers.route.forEach(l => showLignes  ? state.map.addLayer(l) : state.map.removeLayer(l));
  state.mapLayers.markers.forEach(l => showArrets ? state.map.addLayer(l) : state.map.removeLayer(l));
  state.mapLayers.network.forEach(l => showArrets ? state.map.addLayer(l) : state.map.removeLayer(l));
}

// ── ACCESSIBILITÉ ──────────────────────────────────────────────
function toggleAccess(type, el) {
  el.classList.toggle('on');
  if (type === 'largeText') document.body.classList.toggle('large-text', el.classList.contains('on'));
  if (type === 'contrast')  document.body.classList.toggle('high-contrast', el.classList.contains('on'));
}
function toggleVoice(el) {
  el.classList.toggle('on');
  showNotif(el.classList.contains('on') ? '🔊 Lecture vocale activée.' : '🔇 Désactivée.');
}

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  ['inputDate','horairesDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
  loadGTFS();
});
