# Malaysia Tourism: Where the World Comes to Stay

An interactive data visualisation dashboard exploring Malaysia's tourism recovery through visitor markets, arrival routes, hotel guest distribution, hotel supply, occupancy patterns, and tourism revenue resilience.

Built for **FIT2179 Data Visualisation 2** (Monash University) using **Vega-Lite**, hand-built SVG, and vanilla HTML/CSS/JavaScript.

**[Live Dashboard →](https://nicknificient.github.io/FIT2179-DV2-Malaysia-Tourism/)**

![Dashboard preview — hero section and Visitor Markets](./assets/preview.png)

*Full-page screenshot: [`assets/full-dashboard.png`](./assets/full-dashboard.png)*

---

## Project Overview

Malaysia's tourism sector has recovered strongly since COVID-19 border closures, but that recovery is not evenly distributed — across visitor markets, arrival modes, states, hotel supply, or revenue. This dashboard tells that uneven-recovery story across five guided sections, designed for a general Malaysian audience using clear chart titles, concise annotations, and accessible visual design rather than analyst-grade tooling.

1. **Who visits Malaysia — and which markets are growing?**
2. **How do tourists arrive — and where do they stay?**
3. **Is hotel supply keeping pace with demand?**
4. **When and where are hotels busiest?**
5. **Is Malaysia's tourism recovery resilient?**

---

## Why this project is more than "ten Vega-Lite charts"

The unit brief explicitly rewards visualisations that go beyond standard idioms — work that "cannot be easily created with generative AI" and "requires derived data, or combining various idioms." Three of the eleven visualisations in this dashboard are **not Vega-Lite charts at all** — they're hand-built SVG renderers written directly against raw JSON, because no off-the-shelf idiom (in Vega-Lite or otherwise) fit the question being asked:

| Custom visualisation | Why it had to be built, not configured |
|---|---|
| **Treemap** (regional visitor composition) | Implemented the *squarified treemap algorithm* from scratch — recursively subdividing area in proportion to value while keeping rectangles close to square, the same approach used internally by D3's treemap layout. Vega-Lite has no native treemap mark. |
| **Hotel supply pressure matrix** (bubble chart) | A three-variable view — hotel rooms (x), occupancy rate (y), total guests (bubble size) — with quadrant shading, dashed reference lines at the fleet-wide average, and a custom radius-scaled size legend. Built in raw SVG so quadrant labels, label collision offsets, and the filter-driven re-render could all be controlled precisely. |
| **Supply ladder** (rooms + occupancy combo) | A bar chart and a dot plot sharing one row-based coordinate system per state, with a "typical occupancy" reference line — not a standard chart type, assembled as one SVG per row. |

The rest of the dashboard runs on Vega-Lite (`vega-embed`), with one visualisation pushing Vega-Lite past its usual declarative use:

- **The choropleth map's zoom and pan are not Vega-Lite defaults.** Three Vega-Lite `params` (`zoom_level`, `centre_lon`, `centre_lat`) are bound into the Mercator projection's `scale` and `center` as runtime expressions. A vanilla JS slider and a state dropdown then drive those params externally — `view.signal('zoom_level', value).run()` — so the map view updates live without re-rendering the whole spec. This connects Vega's reactive signal graph to plain DOM controls, rather than relying on Vega-Lite's own (more limited) built-in pan/zoom selection.

This mix was deliberate: **Vega-Lite where its grammar fits the chart, hand-built SVG where it doesn't**, rather than forcing every idiom through one tool because it's convenient.

---

## How it's built

```
index.html      — single-page layout, five scrollable sections, no major-section-swap navigation (per brief)
css/style.css    — design system: CSS custom properties for colour/type/spacing, editorial serif + sans pairing
js/main.js       — chart orchestration: Vega-Lite embeds, three custom SVG renderers, interactivity wiring
js/specs.json    — Vega-Lite specifications (JSON), one object per chart, fetched once and reused
data/*.json      — cleaned tourism datasets (arrivals, transport mode, hotel supply, occupancy, revenue, GeoJSON)
```

**Rendering pipeline.** `main.js` fetches `specs.json` once on load, then calls a dedicated render function per chart (`renderTreemap()`, `renderChoropleth()`, `renderPressureMatrix()`, etc.). Vega-Lite charts are mounted with `vegaEmbed(selector, spec, opts)`; the three custom charts build an SVG string directly from the fetched JSON and inject it via `container.innerHTML`. Keeping each chart behind its own named function — rather than one large render loop — made it possible to re-render a single chart (e.g. the pressure matrix on filter-click) without touching anything else on the page.

**Design system.** All colour, typography, spacing, and shadow values are defined once as CSS custom properties (`:root { --teal: ...; --coral: ...; --serif: 'Playfair Display'... }`) and referenced throughout `style.css` and inline SVG `font-family` attributes — so the SVG-rendered charts and the Vega-Lite charts share one consistent typographic and colour identity instead of drifting apart.

---

## Visualisation Techniques

| Idiom | Used for |
|---|---|
| Ranked bar charts (split into two ranges) | Top 15 visitor source markets |
| Squarified treemap *(custom-built)* | Regional visitor composition |
| Grouped bar chart | Arrival mode comparison, 2019 vs 2024 |
| Waffle chart | 2024 transport mode share |
| Choropleth map with parameterised zoom/pan *(Vega-Lite + custom controls)* | State-level hotel guest distribution |
| Stacked normalised horizontal bar | Domestic vs foreign guest mix by state |
| Combined bar + dot-plot ladder *(custom-built)* | Hotel rooms vs occupancy by state |
| Quadrant bubble matrix *(custom-built)* | Hotel supply pressure (rooms × occupancy × guests) |
| Heatmap | Monthly occupancy by state |
| Line chart with phase shading | Tourism revenue, 2015–2024 |
| Annual bar chart | Tourist arrival recovery vs 2019 baseline |

Each idiom was chosen for the analytical task, not for variety's sake — the treemap shows proportional regional dominance, the choropleth supports geographic comparison, and the bubble matrix layers three variables to surface supply pressure that a single bar chart couldn't show.

---

## Interactivity

Interactivity is used only where it supports the story, per the brief's "presentation not exploration" requirement — there are no major-section-swapping buttons, only:

- **Hover tooltips** across all charts (native Vega-Lite tooltips for embedded charts; SVG `<title>` elements for the custom-built ones)
- **Choropleth zoom + state-centre dropdown** — re-centres and rescales the Mercator projection live via Vega signal updates
- **Pressure matrix state-group filter** — buttons (`All`, `High demand`, `Major gateways`, `Smaller markets`) re-filter the underlying data and redraw the SVG bubble chart in place

---

## Storyline & Design Rationale

The dashboard uses a presentation-focused storytelling structure — five sections moving from broad visitor demand to deeper diagnosis (origins → arrival behaviour → hotel demand → occupancy pressure → revenue resilience), rather than an open exploratory tool.

- **Layout:** a consistent card-based grid groups related charts for comparison; full-width cards are reserved for the more complex views (hotel supply, occupancy).
- **Colour:** a tourism-inspired palette (teal, cream, gold, coral, warm neutrals). Teal anchors the identity; warm tones flag hotel/demand metrics. Red-green pairings are avoided for colour-blind accessibility, and sequential scales (choropleth, heatmap) run light-to-dark so darker always reads as "higher."
- **Typography:** an editorial serif (Playfair Display) for the headline identity, paired with a sans-serif (DM Sans) for body text, labels, and chart annotations — set as shared CSS variables so the hierarchy stays consistent across both Vega-Lite output and hand-built SVG.

---

## Data Sources

Public tourism datasets combined from multiple Malaysian government and tourism sources, including Tourism Malaysia, the Department of Statistics Malaysia, and the Ministry of Tourism, Arts and Culture Malaysia (covering visitor arrivals, transport mode, hotel inventory, occupancy, and tourism revenue), plus a Malaysia state boundaries GeoJSON for the choropleth map. Full source acknowledgement appears in the dashboard footer.

---

## Tools and Technologies

- **Vega-Lite** + **Vega-Embed** — declarative chart specifications for 8 of 11 visualisations, including a Mercator-projected choropleth map
- **Hand-written SVG (vanilla JS)** — the treemap, supply ladder, and pressure matrix, where no existing idiom fit the analytical task
- **HTML / CSS** — single-page layout, custom design system via CSS variables, no CSS framework
- **GitHub Pages** — static hosting

---

## Repository Structure

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── specs.json
├── data/
│   └── tourism + geographic datasets (JSON)
└── README.md
```

---

## Skills Demonstrated

This project combines declarative charting with hand-built visualisation engineering: reading and combining real-world public datasets, choosing idioms to match the analytical question rather than defaulting to standard charts, building custom SVG renderers where no existing idiom fit, wiring Vega-Lite's reactive signal graph to plain DOM controls, and applying a consistent design system (colour, typography, layout) across both declarative and hand-built chart output.
