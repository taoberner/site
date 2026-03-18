:root {
  --green: #1db37e;
  --green-dark: #159b68;
  --green-light: #e8f9f2;
  --ink: #0d1f1a;
  --ink-mid: #2e4a40;
  --muted: #7a9a8e;
  --border: #d4ede4;
  --bg: #f7fbf9;
  --white: #ffffff;
  --accent: #f0a500;
  --red-soft: #ff6b6b;
  --radius: 16px;
  --shadow: 0 4px 24px rgba(13,31,26,0.08);
  --shadow-lg: 0 12px 48px rgba(13,31,26,0.14);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--ink); font-size: 16px; line-height: 1.6; }
h1,h2,h3,h4 { font-family: 'Syne', sans-serif; line-height: 1.15; }

/* NAV */
nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: rgba(247,251,249,0.95); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
.nav-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.25rem; color: var(--ink); cursor: pointer; }
.nav-logo span { color: var(--green); }
.nav-links { display: flex; gap: 8px; list-style: none; }
.nav-links a { text-decoration: none; color: var(--ink-mid); font-size: 0.875rem; font-weight: 500; padding: 8px 16px; border-radius: 8px; transition: all 0.2s; cursor: pointer; }
.nav-links a:hover, .nav-links a.active { background: var(--green-light); color: var(--green-dark); }
.nav-cta { background: var(--green) !important; color: var(--white) !important; }
.nav-cta:hover { background: var(--green-dark) !important; }

/* PAGES */
.page { display: none; padding-top: 64px; min-height: 100vh; }
.page.active { display: block; }

/* BUTTONS */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 12px; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.95rem; border: none; cursor: pointer; transition: all 0.22s; text-decoration: none; }
.btn-primary { background: var(--green); color: var(--white); box-shadow: 0 4px 20px rgba(29,179,126,0.35); }
.btn-primary:hover { background: var(--green-dark); transform: translateY(-2px); }
.btn-secondary { background: var(--white); color: var(--ink); border: 2px solid var(--border); }
.btn-secondary:hover { border-color: var(--green); color: var(--green); }
.btn-ghost { background: transparent; color: var(--green); border: 2px solid var(--green); }
.btn-ghost:hover { background: var(--green); color: var(--white); }
.btn-sm { padding: 10px 20px; font-size: 0.85rem; }

/* HERO */
.hero { min-height: calc(100vh - 64px); display: flex; align-items: center; padding: 80px 40px; background: linear-gradient(135deg, #f7fbf9 0%, #e8f9f2 50%, #f0faf5 100%); position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: -100px; right: -100px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(29,179,126,0.12) 0%, transparent 70%); border-radius: 50%; animation: pulse 6s ease-in-out infinite; pointer-events: none; }
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
.hero-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; width: 100%; }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--green-light); color: var(--green-dark); border: 1px solid rgba(29,179,126,0.3); padding: 6px 14px; border-radius: 100px; font-size: 0.8rem; font-weight: 500; margin-bottom: 20px; }
.hero-badge .dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; animation: blink 2s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
.hero h1 { font-size: 3.2rem; font-weight: 800; margin-bottom: 20px; letter-spacing: -0.02em; }
.hero h1 span { color: var(--green); }
.hero-sub { font-size: 1.1rem; color: var(--ink-mid); margin-bottom: 36px; max-width: 460px; }
.hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
.hero-visual { background: var(--white); border-radius: 24px; box-shadow: var(--shadow-lg); padding: 28px; border: 1px solid var(--border); }
.hero-visual-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 16px; font-weight: 500; }
.data-status { display: flex; flex-direction: column; gap: 10px; }
.data-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--bg); border-radius: 10px; border: 1px solid var(--border); font-size: 0.85rem; }
.di-icon { font-size: 1.1rem; }
.di-label { font-weight: 500; flex: 1; }
.di-val { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--green); font-size: 0.9rem; }
.di-val.loading { color: var(--muted); }

/* SECTIONS */
.section { padding: 80px 40px; }
.section-inner { max-width: 1100px; margin: 0 auto; }
.section-label { display: inline-block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--green); font-weight: 600; margin-bottom: 12px; }
.section-title { font-size: 2.2rem; font-weight: 800; margin-bottom: 16px; }
.promises { padding: 60px 40px; background: var(--white); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.promises-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1100px; margin: 0 auto; }
.promise-card { padding: 32px; border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg); transition: all 0.25s; }
.promise-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); border-color: var(--green); }
.promise-icon { font-size: 2rem; margin-bottom: 16px; }
.promise-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
.promise-card p { font-size: 0.9rem; color: var(--ink-mid); }
.how-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; margin-top: 48px; }
.how-step { text-align: center; position: relative; }
.how-step::after { content: '→'; position: absolute; right: -24px; top: 20px; font-size: 1.5rem; color: var(--green); opacity: 0.4; }
.how-step:last-child::after { display: none; }
.how-number { width: 52px; height: 52px; border-radius: 16px; background: var(--green); color: var(--white); font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 16px rgba(29,179,126,0.35); }
.how-step h3 { font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
.how-step p { font-size: 0.875rem; color: var(--ink-mid); }

/* FORMS */
.search-page, .horaires-page, .access-page, .about-page { padding: 40px; }
.search-inner, .horaires-inner, .access-inner, .about-inner { max-width: 760px; margin: 0 auto; }
.about-inner { max-width: 900px; }
.search-inner h1, .horaires-inner h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; }
.search-inner > p, .horaires-inner > p { color: var(--muted); margin-bottom: 36px; }
.form-card { background: var(--white); border-radius: 20px; border: 1px solid var(--border); padding: 36px; box-shadow: var(--shadow); margin-bottom: 20px; }
.form-card h2 { font-size: 1rem; font-weight: 700; margin-bottom: 20px; color: var(--ink-mid); text-transform: uppercase; letter-spacing: 0.05em; font-family: 'DM Sans', sans-serif; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; position: relative; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--ink-mid); }
.form-group input, .form-group select { padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--border); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: var(--ink); background: var(--bg); outline: none; transition: border-color 0.2s; }
.form-group input:focus { border-color: var(--green); }

/* AUTOCOMPLETE */
.autocomplete-list { position: absolute; top: 100%; left: 0; right: 0; background: var(--white); border: 1.5px solid var(--green); border-radius: 10px; box-shadow: var(--shadow-lg); z-index: 500; max-height: 280px; overflow-y: auto; margin-top: 4px; }
.autocomplete-item { padding: 10px 16px; font-size: 0.88rem; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.15s; display: flex; flex-direction: column; gap: 2px; }
.autocomplete-item:hover { background: var(--green-light); color: var(--green-dark); }
.autocomplete-item:last-child { border-bottom: none; }
.ac-name { font-weight: 500; display: flex; align-items: center; gap: 6px; }
.ac-detail { font-size: 0.75rem; color: var(--muted); padding-left: 20px; }

/* CHIPS */
.pref-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.pref-chip { padding: 8px 16px; border-radius: 100px; border: 1.5px solid var(--border); background: var(--white); font-size: 0.84rem; cursor: pointer; transition: all 0.2s; }
.pref-chip:hover { border-color: var(--green); color: var(--green); }
.pref-chip.selected { background: var(--green-light); border-color: var(--green); color: var(--green-dark); font-weight: 500; }
.profile-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.profile-card { padding: 16px; border-radius: 14px; border: 1.5px solid var(--border); cursor: pointer; text-align: center; transition: all 0.2s; background: var(--white); }
.profile-card:hover { border-color: var(--green); }
.profile-card.selected { background: var(--green-light); border-color: var(--green); }
.profile-card .profile-icon { font-size: 1.6rem; margin-bottom: 6px; }
.profile-card p { font-size: 0.82rem; font-weight: 600; }

/* LOADING */
.loading-overlay { display: none; position: fixed; inset: 0; background: rgba(247,251,249,0.95); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; flex-direction: column; gap: 20px; }
.loading-overlay.active { display: flex; }
.loading-spinner { width: 56px; height: 56px; border: 4px solid var(--border); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--green-dark); font-size: 1.1rem; }
.loading-sub { font-size: 0.85rem; color: var(--muted); }
.loading-progress { width: 280px; height: 4px; background: var(--border); border-radius: 100px; overflow: hidden; }
.loading-progress-bar { height: 100%; background: var(--green); border-radius: 100px; transition: width 0.3s; width: 0%; }

.data-loader { position: fixed; top: 64px; left: 0; right: 0; z-index: 999; background: var(--ink); color: white; padding: 10px 24px; display: flex; align-items: center; gap: 12px; font-size: 0.85rem; transform: translateY(-100%); transition: transform 0.3s; }
.data-loader.visible { transform: translateY(0); }
.data-loader-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.2); border-radius: 100px; overflow: hidden; }
.data-loader-fill { height: 100%; background: var(--green); border-radius: 100px; transition: width 0.5s; }

/* RESULTS */
.results-page { padding: 40px; }
.results-inner { max-width: 1100px; margin: 0 auto; }
.results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.results-header h1 { font-size: 1.8rem; font-weight: 800; }
.results-route { font-size: 0.95rem; color: var(--muted); margin-top: 4px; }
.gtfs-badge { display:inline-flex;align-items:center;gap:6px;background:#e8f0ff;color:#2c5ae9;border-radius:8px;padding:4px 10px;font-size:0.72rem;font-weight:600; }
.results-grid { display: grid; grid-template-columns: 1fr 380px; gap: 28px; }
.main-result { background: var(--white); border-radius: 20px; border: 1px solid var(--border); padding: 32px; box-shadow: var(--shadow); }
.result-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--green); color: white; border-radius: 8px; padding: 4px 12px; font-size: 0.78rem; font-weight: 600; margin-bottom: 20px; }
.result-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid var(--border); }
.stat-block { text-align: center; }
.stat-val { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: var(--ink); }
.stat-label { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
.timeline { display: flex; flex-direction: column; }
.tl-item { display: flex; gap: 20px; padding-bottom: 20px; }
.tl-left { display: flex; flex-direction: column; align-items: center; width: 40px; flex-shrink: 0; }
.tl-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--green); border: 3px solid var(--white); box-shadow: 0 0 0 2px var(--green); flex-shrink: 0; margin-top: 4px; }
.tl-dot.walk { background: var(--accent); box-shadow: 0 0 0 2px var(--accent); }
.tl-dot.end { background: var(--ink); box-shadow: 0 0 0 2px var(--ink); }
.tl-line { flex: 1; width: 2px; background: var(--border); margin-top: 4px; }
.tl-item:last-child .tl-line { display: none; }
.tl-content h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 2px; }
.tl-content p { font-size: 0.8rem; color: var(--muted); }
.tl-time { font-size: 0.78rem; font-weight: 600; color: var(--green); background: var(--green-light); padding: 2px 8px; border-radius: 6px; display: inline-block; margin-top: 4px; }
.sidebar-results { display: flex; flex-direction: column; gap: 20px; }
.why-box { background: var(--green-light); border-radius: 16px; padding: 20px; border: 1px solid rgba(29,179,126,0.2); }
.why-box h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 10px; color: var(--green-dark); }
.why-item { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; font-size: 0.85rem; color: var(--green-dark); }
.why-item::before { content: '✓'; font-weight: 700; color: var(--green); flex-shrink: 0; }
.eco-box { background: var(--white); border-radius: 16px; padding: 20px; border: 1px solid var(--border); }
.eco-box h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 14px; }
.eco-compare { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.eco-col { text-align: center; flex: 1; }
.eco-val { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; }
.eco-val.green { color: var(--green); }
.eco-val.red { color: var(--red-soft); }
.eco-col p { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
.eco-divider { color: var(--muted); font-size: 1.2rem; }
.eco-saved { margin-top: 12px; background: var(--green-light); border-radius: 10px; padding: 10px; text-align: center; font-size: 0.82rem; color: var(--green-dark); font-weight: 500; }
.alt-title { font-size: 0.85rem; font-weight: 700; color: var(--ink-mid); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
.alt-cards { display: flex; flex-direction: column; gap: 10px; }
.alt-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.2s; }
.alt-card:hover { border-color: var(--green); box-shadow: var(--shadow); }
.alt-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.alt-card-header h4 { font-size: 0.88rem; font-weight: 700; }
.alt-tag { font-size: 0.72rem; padding: 3px 10px; border-radius: 100px; font-weight: 600; }
.tag-fast { background: #fff0f0; color: #c0392b; }
.tag-eco { background: var(--green-light); color: var(--green-dark); }
.tag-acc { background: #f0f4ff; color: #2c5ae9; }
.alt-stats { display: flex; gap: 12px; font-size: 0.78rem; color: var(--muted); }
.result-actions { display: flex; gap: 10px; margin-top: 28px; flex-wrap: wrap; }
.result-actions .btn { font-size: 0.82rem; padding: 10px 18px; }
.no-result { text-align: center; padding: 60px 20px; }
.no-result .no-icon { font-size: 3rem; margin-bottom: 16px; }
.no-result h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; }
.no-result p { color: var(--muted); margin-bottom: 20px; }

/* HORAIRES */
.horaires-table-wrap { background: var(--white); border-radius: 20px; border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow); }
.horaires-table { width: 100%; border-collapse: collapse; }
.horaires-table th { background: var(--ink); color: white; padding: 14px 18px; text-align: left; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.05em; }
.horaires-table td { padding: 12px 18px; border-bottom: 1px solid var(--border); font-size: 0.88rem; }
.horaires-table tr:last-child td { border-bottom: none; }
.horaires-table tr:hover td { background: var(--green-light); }
.badge-ligne { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; background: #e8f0ff; color: #2c5ae9; }
.time-pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; background: var(--green-light); color: var(--green-dark); }
.time-pill.past { background: #f0f0f0; color: var(--muted); }
.time-pill.next { background: var(--green); color: white; }

/* MAP */
.map-page { padding: 40px; }
.map-inner { max-width: 1100px; margin: 0 auto; }
.map-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; margin-top: 24px; }
.map-sidebar { display: flex; flex-direction: column; gap: 16px; }
.map-panel { background: var(--white); border-radius: 16px; border: 1px solid var(--border); padding: 20px; }
.map-panel h3 { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); margin-bottom: 14px; }
.map-info-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
.map-info-item:last-child { border-bottom: none; }
.map-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
#leaflet-map { width: 100%; height: 540px; border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow); }
.filter-check { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 0.84rem; cursor: pointer; }
.filter-check input { accent-color: var(--green); }
.map-legend { display: flex; flex-wrap: wrap; gap: 10px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--ink-mid); }
.legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }

/* ACCESSIBILITY */
.toggle-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 20px; }
.toggle-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: var(--bg); border-radius: 12px; border: 1.5px solid var(--border); }
.toggle-label { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 500; }
.toggle-switch { width: 44px; height: 24px; background: var(--border); border-radius: 100px; position: relative; cursor: pointer; transition: background 0.25s; flex-shrink: 0; }
.toggle-switch.on { background: var(--green); }
.toggle-switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: left 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
.toggle-switch.on::after { left: 23px; }
.profiles-grid-acc { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; margin-top: 20px; }
.profile-detail-card { background: var(--white); border-radius: 16px; border: 1.5px solid var(--border); padding: 24px; transition: all 0.25s; }
.profile-detail-card:hover { border-color: var(--green); box-shadow: var(--shadow); }
.pd-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.pd-icon { width: 48px; height: 48px; border-radius: 14px; background: var(--green-light); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.pd-title { font-weight: 700; font-size: 1rem; }
.pd-sub { font-size: 0.8rem; color: var(--muted); }
.profile-features { list-style: none; }
.profile-features li { padding: 6px 0; font-size: 0.85rem; color: var(--ink-mid); display: flex; align-items: center; gap: 8px; }
.profile-features li::before { content: '•'; color: var(--green); font-weight: 800; font-size: 1rem; }

/* ABOUT */
.about-hero { text-align: center; padding: 60px 0 40px; }
.about-hero h1 { font-size: 2.8rem; font-weight: 800; margin-bottom: 16px; }
.about-section { margin-bottom: 48px; }
.about-section h2 { font-size: 1.4rem; font-weight: 800; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid var(--green-light); }
.values-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
.value-card { padding: 20px; background: var(--white); border-radius: 14px; border: 1px solid var(--border); display: flex; gap: 14px; }
.value-icon { font-size: 1.5rem; flex-shrink: 0; }
.value-card h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 4px; }
.value-card p { font-size: 0.84rem; color: var(--ink-mid); }
.tech-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.tech-pill { padding: 8px 18px; background: var(--white); border: 1.5px solid var(--border); border-radius: 100px; font-size: 0.85rem; font-weight: 500; }

/* MISC */
.divider { height: 1px; background: var(--border); margin: 0 40px; }
footer { background: var(--ink); color: rgba(255,255,255,0.7); padding: 40px; margin-top: 60px; }
.footer-inner { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.footer-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--white); }
.footer-logo span { color: var(--green); }
.footer-info { font-size: 0.82rem; text-align: center; }
.info-box { background: #fffbf0; border: 1px solid #ffe4a0; border-radius: 12px; padding: 16px 20px; display: flex; align-items: flex-start; gap: 12px; margin-top: 20px; }
.info-box p { font-size: 0.875rem; color: #8a6200; }
.notif { position: fixed; bottom: 24px; right: 24px; background: var(--ink); color: white; padding: 14px 20px; border-radius: 12px; font-size: 0.88rem; font-weight: 500; z-index: 9999; box-shadow: var(--shadow-lg); max-width: 340px; animation: slideIn 0.3s ease; }
.notif.green { background: var(--green-dark); }
.notif.red { background: #c0392b; }
@keyframes slideIn { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
body.large-text { font-size: 19px; }
body.high-contrast { filter: contrast(1.4); }

@media (max-width: 768px) {
  nav { padding: 0 20px; }
  .nav-links { display: none; }
  .hero-inner, .results-grid, .map-layout, .profiles-grid-acc, .values-grid { grid-template-columns: 1fr; }
  .hero { padding: 40px 20px; }
  .hero h1 { font-size: 2.2rem; }
  .promises-grid, .how-steps { grid-template-columns: 1fr; }
  .section { padding: 48px 20px; }
  .result-stats { grid-template-columns: repeat(2,1fr); }
  .form-row { grid-template-columns: 1fr; }
}
