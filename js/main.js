/* Malaysia Tourism Dashboard — main.js */

const VEGA_OPTS = {
  actions: false,
  renderer: 'svg',
  tooltip: { theme: 'light' }
};

let SPECS = {};

fetch('js/specs.json')
  .then(r => r.json())
  .then(s => { SPECS = s; renderAll(); });

function renderAll() {
  renderTreemap();
  renderArrivalsBarTop6();
  renderArrivalsBar7to15();
  renderTransportBar();
  renderChoropleth();
  renderStackedGuests();
  renderPressureMatrix();
  renderSupplyLadder();
  renderAorHeatmap();
  renderRevenueLine();
  renderArrivalsAnnual();
  renderWaffle();
  animateKPIs();
}

/* ══════════════════════════════════════════════════════
   1. REGION TREEMAP
   ══════════════════════════════════════════════════════ */
function renderTreemap() {
  const container = document.getElementById('chart-treemap');
  if (!container) return;

  const regionColors = {
    'ASEAN':'#176B73','Asia':'#56B4E9','Europe':'#7B6FD0',
    'Oceania':'#C9B27E','Americas':'#D8A72A','Middle East':'#D96B4C','Africa':'#8A6F5A'
  };
  const textColors = {
    'ASEAN':'#fff','Asia':'#fff','Europe':'#fff',
    'Oceania':'#3D2A00','Americas':'#3D2A00','Middle East':'#fff','Africa':'#fff'
  };

  fetch('data/region_treemap.json').then(r => r.json()).then(data => {
    const W = container.offsetWidth || 560;
    const H = 320;
    const total = data.reduce((s,d) => s + d.Arrivals_2025, 0);

    function squarify(items, x, y, w, h) {
      if (!items.length) return [];
      const rects = [];
      let remaining = [...items];
      let rx = x, ry = y, rw = w, rh = h;
      while (remaining.length) {
        const isHoriz = rw >= rh;
        const rowItems = [];
        let rowVal = 0;
        const remVal = remaining.reduce((s,d) => s + d.Arrivals_2025, 0);
        for (let i = 0; i < remaining.length; i++) {
          const testVal = rowVal + remaining[i].Arrivals_2025;
          const dim = isHoriz ? rw*(testVal/remVal) : rh*(testVal/remVal);
          const testItems = [...rowItems, remaining[i]];
          const ratio = testItems.reduce((worst,d) => {
            const dDim = isHoriz ? rh*(d.Arrivals_2025/testVal) : rw*(d.Arrivals_2025/testVal);
            return Math.max(worst, Math.max(dim/dDim, dDim/dim));
          }, 0);
          if (rowItems.length === 0 || ratio < 2.5) { rowItems.push(remaining[i]); rowVal += remaining[i].Arrivals_2025; }
          else break;
        }
        if (rowItems.length === 0) { rowItems.push(remaining[0]); rowVal = remaining[0].Arrivals_2025; }
        remaining = remaining.slice(rowItems.length);
        const rowFrac = rowVal / remVal;
        let cx = rx, cy = ry;
        rowItems.forEach(d => {
          const frac = d.Arrivals_2025 / rowVal;
          const bw = isHoriz ? rw*rowFrac : rw*frac;
          const bh = isHoriz ? rh*frac   : rh*rowFrac;
          rects.push({...d, x:cx, y:cy, w:bw, h:bh});
          if (isHoriz) cy += bh; else cx += bw;
        });
        if (isHoriz) { const s=rw*rowFrac; rx+=s; rw-=s; }
        else         { const s=rh*rowFrac; ry+=s; rh-=s; }
      }
      return rects;
    }

    const gap = 3;
    const rects = squarify(data, 0, 0, W, H);
    const cells = rects.map(d => {
      const bg = regionColors[d.Region]||'#888';
      const fg = textColors[d.Region]||'#fff';
      const x = d.x+gap/2, y = d.y+gap/2;
      const w = Math.max(0,d.w-gap), h = Math.max(0,d.h-gap);
      const pct = ((d.Arrivals_2025/total)*100).toFixed(1);
      const arr = d.Arrivals_2025>=1e6 ? (d.Arrivals_2025/1e6).toFixed(1)+'M' : (d.Arrivals_2025/1e3).toFixed(0)+'K';
      const canLabel = w>60 && h>36;
      const fontSize = Math.min(14, Math.max(9, Math.min(w/7, h/3)));
      const tip = `${d.Region}\nArrivals 2025: ${d.Arrivals_2025.toLocaleString()}\nShare: ${pct}%`;
      return `<g class="treemap-cell">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${bg}" opacity="0.93"/>
        ${canLabel ? `<text x="${x+w/2}" y="${y+h/2}" text-anchor="middle" dominant-baseline="middle"
          font-family="DM Sans,sans-serif" font-size="${fontSize}" font-weight="700"
          fill="${fg}" pointer-events="none">${d.Region}</text>` : ''}
        <title>${tip}</title></g>`;
    }).join('');

    container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
      style="width:100%;height:${H}px;border-radius:8px;overflow:hidden;display:block;">${cells}</svg>`;

    const legendEl = document.getElementById('treemap-legend');
    if (legendEl) {
      legendEl.innerHTML = Object.entries(regionColors).map(([r,c]) =>
        `<span class="legend-item"><span class="legend-dot" style="background:${c};border-radius:3px;"></span>${r}</span>`).join('');
    }
  });
}

/* ══════════════════════════════════════════════════════
   2a. Bullet Bar — Ranks 1–6
   ══════════════════════════════════════════════════════ */
function renderArrivalsBarTop6() {
  vegaEmbed('#chart-arrivals-top6', SPECS.arrivals_bar_top6, VEGA_OPTS);
}

/* ══════════════════════════════════════════════════════
   2b. Bullet Bar — Ranks 7–15
   ══════════════════════════════════════════════════════ */
function renderArrivalsBar7to15() {
  vegaEmbed('#chart-arrivals-7to15', SPECS.arrivals_bar_7to15, VEGA_OPTS);
}

/* ══════════════════════════════════════════════════════
   3. Transport Bar
   ══════════════════════════════════════════════════════ */
function renderTransportBar() {
  vegaEmbed('#chart-transport', SPECS.transport_bar, VEGA_OPTS);
}

/* ══════════════════════════════════════════════════════
   4. Choropleth Map
   ══════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════
   4. Choropleth — with zoom slider + state-centre dropdown
   ══════════════════════════════════════════════════════ */

// State centres: [longitude, latitude]
const STATE_CENTRES = {
  'All Malaysia':    [109.5, 4.0],
  'Kuala Lumpur':    [101.69, 3.14],
  'Selangor':        [101.5, 3.2],
  'Johor':           [103.5, 1.8],
  'Negeri Sembilan': [102.2, 2.7],
  'Melaka':          [102.25, 2.2],
  'Pahang':          [103.0, 3.8],
  'Perak':           [101.1, 4.4],
  'Penang':          [100.35, 5.4],
  'Kedah':           [100.6, 6.1],
  'Kelantan':        [102.2, 5.5],
  'Terengganu':      [103.1, 5.1],
  'Perlis':          [100.2, 6.5],
  'Sabah':           [117.0, 5.5],
  'Sarawak':         [113.5, 3.0],
  'Putrajaya':       [101.68, 2.93],
  'Labuan':          [115.23, 5.28]
};

let choroView = null;

function renderChoropleth() {
  vegaEmbed('#chart-map', SPECS.choropleth, VEGA_OPTS).then(result => {
    choroView = result.view;
    // initialise controls
    setupChoroControls();
  });
}

function setupChoroControls() {
  const container = document.getElementById('chart-map');
  const card = container.closest('.card');

  // Build controls bar if not already present
  if (card.querySelector('.choro-controls')) return;

  const bar = document.createElement('div');
  bar.className = 'choro-controls';
  bar.style.cssText = `
    display:flex; align-items:center; gap:20px; flex-wrap:wrap;
    margin-top:14px; padding-top:12px;
    border-top:1px solid var(--border);
    font-family:var(--sans); font-size:0.85rem; color:var(--text-muted);
  `;

  // ── Zoom slider ──
  const zoomLabel = document.createElement('label');
  zoomLabel.style.cssText = 'display:flex;align-items:center;gap:8px;';
  zoomLabel.innerHTML = `<span style="font-weight:500;color:var(--text-mid);">Zoom</span>`;

  const zoomSlider = document.createElement('input');
  zoomSlider.type = 'range';
  zoomSlider.min = 800;
  zoomSlider.max = 8000;
  zoomSlider.value = 1500;
  zoomSlider.style.cssText = 'width:120px; accent-color:var(--teal); cursor:pointer;';

  zoomLabel.appendChild(zoomSlider);
  bar.appendChild(zoomLabel);

  // ── State centre dropdown ──
  const stateLabel = document.createElement('label');
  stateLabel.style.cssText = 'display:flex;align-items:center;gap:8px;';
  stateLabel.innerHTML = `<span style="font-weight:500;color:var(--text-mid);">Map Centre</span>`;

  const stateSelect = document.createElement('select');
  stateSelect.style.cssText = `
    font-family:var(--sans); font-size:0.85rem;
    padding:4px 10px; border-radius:6px;
    border:1.5px solid var(--border); background:var(--surface);
    color:var(--text-mid); cursor:pointer;
  `;
  Object.keys(STATE_CENTRES).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    stateSelect.appendChild(opt);
  });

  stateLabel.appendChild(stateSelect);
  bar.appendChild(stateLabel);

  // ── Reset button ──
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset';
  resetBtn.style.cssText = `
    font-family:var(--sans); font-size:0.82rem; font-weight:500;
    padding:5px 14px; border-radius:100px;
    border:1.5px solid var(--border); background:var(--surface);
    color:var(--text-mid); cursor:pointer;
  `;
  resetBtn.onclick = () => {
    zoomSlider.value = 1500;
    stateSelect.value = 'All Malaysia';
    applyChoroView(1500, STATE_CENTRES['All Malaysia']);
  };
  bar.appendChild(resetBtn);

  card.appendChild(bar);

  // ── Event listeners ──
  function applyChoroView(scale, centre) {
    if (!choroView) return;
    choroView.signal('zoom_level', scale).run();
    choroView.signal('centre_lon', centre[0]).run();
    choroView.signal('centre_lat', centre[1]).run();
  }

  zoomSlider.oninput = () => {
    const centre = STATE_CENTRES[stateSelect.value] || STATE_CENTRES['All Malaysia'];
    applyChoroView(+zoomSlider.value, centre);
  };

  stateSelect.onchange = () => {
    const centre = STATE_CENTRES[stateSelect.value] || STATE_CENTRES['All Malaysia'];
    applyChoroView(+zoomSlider.value, centre);
  };
}


/* ══════════════════════════════════════════════════════
   5. Stacked Normalised Bar
   ══════════════════════════════════════════════════════ */
function renderStackedGuests() {
  vegaEmbed('#chart-stacked', SPECS.stacked_guests, VEGA_OPTS);
}

/* ══════════════════════════════════════════════════════
   6. HOTEL SUPPLY PRESSURE MATRIX — custom SVG
   ══════════════════════════════════════════════════════ */
let matrixAllData = null;
let matrixFilter  = 'all';

// State groups sorted by Total_2025 desc
const MATRIX_GROUPS = {
  all:     null,   // show all
  top5:    ['Kuala Lumpur','Pahang','Johor','Selangor','Pulau Pinang'],
  top7:    ['Kuala Lumpur','Pahang','Johor','Selangor','Pulau Pinang','Sabah','Sarawak'],
  bottom6: ['Kedah','Perak','Melaka','Negeri Sembilan','Terengganu','Perlis']
};

function renderPressureMatrix() {
  const container = document.getElementById('chart-pressure-matrix');
  if (!container) return;
  fetch('data/supply_ladder.json').then(r => r.json()).then(data => {
    matrixAllData = data;
    drawPressureMatrix();
    initMatrixFilter();
  });
}

function drawPressureMatrix() {
  const container = document.getElementById('chart-pressure-matrix');
  if (!container || !matrixAllData) return;

  const allowed = MATRIX_GROUPS[matrixFilter];
  const data = allowed ? matrixAllData.filter(d => allowed.includes(d.State)) : matrixAllData;

  const W   = container.offsetWidth || 800;
  const H   = 360;
  const pad = { top: 40, right: 220, bottom: 64, left: 64 };
  const cw  = W - pad.left - pad.right;
  const ch  = H - pad.top  - pad.bottom;

  const maxRooms   = 72000;
  const minAOR = 30, maxAOR = 85;
  const vLineRooms = 30000;
  const hLineAOR   = 55;
  const maxGuests  = 24000000;

  function scX(v) { return pad.left + (v / maxRooms) * cw; }
  function scY(v) { return pad.top  + ch - ((v - minAOR) / (maxAOR - minAOR)) * ch; }
  // Smaller bubbles: max radius ~28 instead of 44
  function scR(g) { return 5 + Math.sqrt(g / maxGuests) * 26; }

  const vx = scX(vLineRooms);
  const hy = scY(hLineAOR);

  // quadrant shading
  const quads = `
    <rect x="${pad.left}" y="${pad.top}" width="${vx-pad.left}" height="${hy-pad.top}" fill="#D96B4C" opacity="0.05"/>
    <rect x="${vx}" y="${pad.top}" width="${pad.left+cw-vx}" height="${hy-pad.top}" fill="#D8A72A" opacity="0.05"/>
    <rect x="${pad.left}" y="${hy}" width="${vx-pad.left}" height="${pad.top+ch-hy}" fill="#176B73" opacity="0.05"/>
    <rect x="${vx}" y="${hy}" width="${pad.left+cw-vx}" height="${pad.top+ch-hy}" fill="#C9B27E" opacity="0.06"/>`;

  const qLabels = `
    <text x="${pad.left+10}" y="${pad.top+18}" font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#D96B4C" opacity="0.85">Smaller supply,</text>
    <text x="${pad.left+10}" y="${pad.top+31}" font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#D96B4C" opacity="0.85">high pressure</text>
    <text x="${vx+8}" y="${pad.top+18}" font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#D8A72A" opacity="0.85">Large supply,</text>
    <text x="${vx+8}" y="${pad.top+31}" font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#D8A72A" opacity="0.85">strong demand</text>
    <text x="${pad.left+10}" y="${hy+ch*0.38}" font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#176B73" opacity="0.75">Smaller market,</text>
    <text x="${pad.left+10}" y="${hy+ch*0.38+14}" font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#176B73" opacity="0.75">lower use</text>
    <text x="${vx+8}" y="${hy+ch*0.38}" font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#C9B27E" opacity="0.9">Large supply,</text>
    <text x="${vx+8}" y="${hy+ch*0.38+14}" font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#C9B27E" opacity="0.9">softer use</text>`;

  const roomTicks = [0,10000,20000,30000,40000,50000,60000,70000];
  const aorTicks  = [30,40,50,60,70,80];
  const gridLines =
    roomTicks.map(v => {
      const x = scX(v);
      return `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top+ch}" stroke="#DDD6CC" stroke-width="0.8"/>
              <text x="${x}" y="${pad.top+ch+16}" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="9.5" fill="#999">${v===0?'0':v>=1000?(v/1000)+'K':v}</text>`;
    }).join('') +
    aorTicks.map(v => {
      const y = scY(v);
      return `<line x1="${pad.left}" y1="${y}" x2="${pad.left+cw}" y2="${y}" stroke="#DDD6CC" stroke-width="0.8"/>
              <text x="${pad.left-6}" y="${y+4}" text-anchor="end" font-family="DM Sans,sans-serif" font-size="9.5" fill="#999">${v}%</text>`;
    }).join('');

  const refLines = `
    <line x1="${vx}" y1="${pad.top}" x2="${vx}" y2="${pad.top+ch}" stroke="#888" stroke-width="1.2" stroke-dasharray="5,4"/>
    <line x1="${pad.left}" y1="${hy}" x2="${pad.left+cw}" y2="${hy}" stroke="#888" stroke-width="1.2" stroke-dasharray="5,4"/>`;

  const axisLabels = `
    <text x="${pad.left+cw/2}" y="${H-6}" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="11" font-weight="500" fill="#555">Total Hotel Rooms</text>
    <text x="16" y="${pad.top+ch/2}" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="11" font-weight="500" fill="#555" transform="rotate(-90,16,${pad.top+ch/2})">Average Occupancy Rate (%)</text>`;

  // Per-state label offsets: [dx, dy, anchor]
  // Positive dx = right of bubble edge, negative = left
  // anchor: "start" or "end"
  const labelCfg = {
    'Kuala Lumpur':    { dx:  12, dy: -14, a: 'start'  },
    'Pahang':          { dx:  10, dy: -14, a: 'start'  },
    'Selangor':        { dx:  10, dy:  14, a: 'start'  },
    'Johor':           { dx: -10, dy: -14, a: 'end'    },
    'Pulau Pinang':    { dx:  10, dy: -14, a: 'start'  },
    'Sabah':           { dx: -10, dy:  14, a: 'end'    },
    'Sarawak':         { dx:  10, dy:  14, a: 'start'  },
    'Perak':           { dx:  10, dy: -14, a: 'start'  },
    'Kedah':           { dx: -10, dy: -14, a: 'end'    },
    'Melaka':          { dx: -10, dy:  14, a: 'end'    },
    'Negeri Sembilan': { dx:  10, dy:  14, a: 'start'  },
    'Terengganu':      { dx:   8, dy: -14, a: 'start'  },
    'Perlis':          { dx:   8, dy: -16, a: 'start'  },
  };

  const bubbles = data.map(d => {
    const cx = scX(d.Rooms), cy = scY(d.AOR), r = scR(d.Total_2025);
    const tip = `${d.State}\nRooms: ${d.Rooms.toLocaleString()}\nOccupancy: ${d.AOR}%\nGuests 2025: ${d.Total_2025.toLocaleString()}`;
    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#176B73" opacity="1" stroke="white" stroke-width="1.5"/>
      <title>${tip}</title>
    </g>`;
  }).join('');

  // size legend — right panel, computed positions
  const legendSizes = [1000000,5000000,10000000,20000000];
  const lx0 = W - pad.right + 32;
  let legendParts = `<text x="${lx0}" y="${pad.top+10}" font-family="DM Sans,sans-serif" font-size="10" font-weight="600" fill="#555">Total Guests 2025</text>`;
  let lyCur = pad.top + 28;
  legendSizes.forEach(v => {
    const r = scR(v);
    lyCur += r;
    const label = (v/1e6).toFixed(0)+'M';
    legendParts += `<circle cx="${lx0+22}" cy="${lyCur}" r="${r}" fill="#176B73" opacity="0.35" stroke="#176B73" stroke-width="1"/>
                    <text x="${lx0+48}" y="${lyCur+4}" font-family="DM Sans,sans-serif" font-size="9.5" fill="#777">${label}</text>`;
    lyCur += r + 8;
  });

  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;height:${H}px;display:block;">
    ${quads}${gridLines}${refLines}${qLabels}${bubbles}${axisLabels}${legendParts}
  </svg>`;
}

function initMatrixFilter() {
  const bar = document.getElementById('matrix-filter');
  if (!bar) return;
  bar.replaceWith(bar.cloneNode(true));
  const freshBar = document.getElementById('matrix-filter');
  freshBar.addEventListener('click', e => {
    const btn = e.target.closest('.matrix-btn');
    if (!btn) return;
    matrixFilter = btn.dataset.state;
    freshBar.querySelectorAll('.matrix-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    drawPressureMatrix();
  });
}

/* ══════════════════════════════════════════════════════
   7. STATE SUPPLY LADDER — custom SVG
   ══════════════════════════════════════════════════════ */
function renderSupplyLadder() {
  const container = document.getElementById('chart-supply-ladder');
  if (!container) return;

  fetch('data/supply_ladder.json').then(r => r.json()).then(data => {
    const W       = container.offsetWidth || 800;
    const rowH    = 30;
    const headerH = 36;
    const H       = headerH + data.length * rowH;

    // ── Column layout ─────────────────────────────────────────
    // State name  : 0 → nameW (right-aligned text)
    // Bar zone    : nameW → nameW+barZoneW  (36% of W — tighter)
    // Occ zone    : nameW+barZoneW+gap → W-occRightPad
    // occRightPad : enough room for "76.3%" label (max 5 chars + %)
    const nameW      = 128;
    const barZoneW   = Math.floor(W * 0.34);
    const gap        = 16;
    const occRightPad = 44;           // fixed right margin — label fits here
    const barL       = nameW;
    const barMaxW    = barZoneW - 6;
    const maxRooms   = 70000;

    const dotMin  = 30, dotMax = 80;
    const scaleL  = nameW + barZoneW + gap;
    const scaleR  = W - occRightPad;  // scale ends before right margin
    const scaleW  = scaleR - scaleL;

    function scBar(rooms) { return (rooms / maxRooms) * barMaxW; }
    function scDot(aor)   { return scaleL + ((aor - dotMin) / (dotMax - dotMin)) * scaleW; }

    const typX = scDot(55);

    let parts = [];

    // ── Column headers ──────────────────────────────────────
    parts.push(`
      <text x="${nameW - 8}" y="22" text-anchor="end"
        font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#176B73">State</text>
      <text x="${barL + barMaxW / 2}" y="22" text-anchor="middle"
        font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#176B73">Hotel Rooms</text>
      <text x="${(scaleL + scaleR) / 2}" y="22" text-anchor="middle"
        font-family="DM Sans,sans-serif" font-size="10.5" font-weight="600" fill="#176B73">Occupancy</text>`);

    // Scale tick labels: 30%, 55%, 80%
    [30, 55, 80].forEach(v => {
      parts.push(`<text x="${scDot(v)}" y="34" text-anchor="middle"
        font-family="DM Mono,monospace" font-size="8.5" fill="#BBB">${v}%</text>`);
    });
    // "Typical" label under 55%
    parts.push(`<text x="${typX}" y="${headerH - 4}" text-anchor="middle"
      font-family="DM Sans,sans-serif" font-size="8" fill="#BBB">Typical</text>`);

    // ── Data rows ───────────────────────────────────────────
    data.forEach((d, i) => {
      const rowY = headerH + i * rowH;
      const midY = rowY + rowH / 2;
      const barW = scBar(d.Rooms);
      // Clamp dot so it never escapes past scaleR
      const rawDotX = scDot(d.AOR);
      const dotX    = Math.min(rawDotX, scaleR - 2);

      // alternating stripe
      if (i % 2 === 0) {
        parts.push(`<rect x="0" y="${rowY}" width="${W}" height="${rowH}" fill="#F7F3EE" opacity="0.55"/>`);
      }
      // row separator
      parts.push(`<line x1="0" y1="${rowY}" x2="${W}" y2="${rowY}" stroke="#EEE9E1" stroke-width="0.8"/>`);

      // state name
      const label = d.State === 'Pulau Pinang' ? 'Penang' : d.State;
      parts.push(`<text x="${nameW - 8}" y="${midY + 4}" text-anchor="end"
        font-family="DM Sans,sans-serif" font-size="10.5" fill="#3D3D3D">${label}</text>`);

      // ghost track bar (full scale width)
      parts.push(`<rect x="${barL}" y="${midY - 5}" width="${barMaxW}" height="10" rx="3" fill="#EEE9E1"/>`);
      // teal data bar
      parts.push(`<rect x="${barL}" y="${midY - 5}" width="${barW}" height="10" rx="3" fill="#176B73"/>`);

      // room count — right of teal bar, clamped inside bar zone
      const countX = Math.min(barL + barW + 4, barL + barMaxW - 2);
      parts.push(`<text x="${countX}" y="${midY + 4}"
        font-family="DM Mono,monospace" font-size="8.5" fill="#666">${d.Rooms.toLocaleString()}</text>`);

      // occ track line
      parts.push(`<line x1="${scaleL}" y1="${midY}" x2="${scaleR}" y2="${midY}"
        stroke="#DDD6CC" stroke-width="1"/>`);

      // typical dotted vertical line
      parts.push(`<line x1="${typX}" y1="${rowY + 5}" x2="${typX}" y2="${rowY + rowH - 5}"
        stroke="#CCC" stroke-width="0.8" stroke-dasharray="2,2"/>`);

      // orange dot
      parts.push(`<circle cx="${dotX}" cy="${midY}" r="5.5" fill="#D96B4C"/>`);

      // AOR label — placed in the fixed right margin (occRightPad area)
      // always visible, never overlaps the scale
      parts.push(`<text x="${scaleR + 6}" y="${midY + 4}" text-anchor="start"
        font-family="DM Mono,monospace" font-size="9" fill="#D96B4C" font-weight="600">${d.AOR}%</text>`);
    });

    // bottom border
    const footY = headerH + data.length * rowH;
    parts.push(`<line x1="0" y1="${footY}" x2="${W}" y2="${footY}" stroke="#EEE9E1" stroke-width="0.8"/>`);

    // axis labels
    parts.push(`
      <text x="${barL + barMaxW / 2}" y="${footY + 16}" text-anchor="middle"
        font-family="DM Sans,sans-serif" font-size="9.5" fill="#BBB">Hotel Rooms</text>
      <text x="${(scaleL + scaleR) / 2}" y="${footY + 16}" text-anchor="middle"
        font-family="DM Sans,sans-serif" font-size="9.5" fill="#BBB">Occupancy Rate (%)</text>`);

    const totalH = footY + 24;
    container.innerHTML = `<svg viewBox="0 0 ${W} ${totalH}" xmlns="http://www.w3.org/2000/svg"
      style="width:100%;height:${totalH}px;display:block;">${parts.join('')}</svg>`;
  });
}

/* ══════════════════════════════════════════════════════
   8. AOR Heatmap
   ══════════════════════════════════════════════════════ */
function renderAorHeatmap() {
  vegaEmbed('#chart-heatmap', SPECS.aor_heatmap, VEGA_OPTS);
}

/* ══════════════════════════════════════════════════════
   9. Revenue Line
   ══════════════════════════════════════════════════════ */
function renderRevenueLine() {
  vegaEmbed('#chart-revenue', SPECS.revenue_line, VEGA_OPTS);
}

/* ══════════════════════════════════════════════════════
   10. Annual Arrivals Bar — 2019–2024
   ══════════════════════════════════════════════════════ */
function renderArrivalsAnnual() {
  vegaEmbed('#chart-arrivals-annual', SPECS.arrivals_annual_bar, VEGA_OPTS);
}

/* ══════════════════════════════════════════════════════
   11. Waffle Chart
   ══════════════════════════════════════════════════════ */
function renderWaffle() {
  const data = [
    {mode:'Land', count:25080202, color:'#176B73'},
    {mode:'Air',  count:10983585, color:'#56B4E9'},
    {mode:'Sea',  count: 1113098, color:'#D8A72A'},
    {mode:'Rail', count:  584600, color:'#7B6FD0'}
  ];
  const total = data.reduce((s,d)=>s+d.count,0);
  const CELLS = 100;
  let cells = [], remaining = CELLS;
  data.forEach((d,i) => {
    const n = i<data.length-1 ? Math.round(d.count/total*CELLS) : remaining;
    remaining -= n;
    for (let j=0;j<n;j++) cells.push(d);
  });
  const grid = document.getElementById('waffle-grid');
  if (!grid) return;
  grid.innerHTML = '';
  cells.forEach(c => {
    const div = document.createElement('div');
    div.className='waffle-cell'; div.style.background=c.color; div.title=c.mode;
    grid.appendChild(div);
  });
  const legend = document.getElementById('waffle-legend');
  if (!legend) return;
  legend.innerHTML = data.map(d =>
    `<span class="legend-item"><span class="legend-dot" style="background:${d.color}"></span>${d.mode} <strong>${(d.count/total*100).toFixed(0)}%</strong></span>`
  ).join('');
}

/* ══════════════════════════════════════════════════════
   12. KPI Counter Animation
   ══════════════════════════════════════════════════════ */
function animateKPIs() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target=parseFloat(el.dataset.count), prefix=el.dataset.prefix||'', suffix=el.dataset.suffix||'';
    const isFloat=String(target).includes('.');
    const start=performance.now();
    function update(now) {
      const t=Math.min((now-start)/1400,1), ease=1-Math.pow(1-t,3), val=target*ease;
      el.textContent=prefix+(isFloat?val.toFixed(1):Math.round(val).toLocaleString())+suffix;
      if(t<1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}
