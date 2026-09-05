# Utility Lens — Delhi MVP (Naraina Vihar, F Block)

> **Status, 2026-09-05.** Plan approved. The repo now exists and this clone pushes
> successfully, so Step 1 (the gating step) is **done** — skip it and start at Step 2.
> Everything below is otherwise as approved.

## Context

A Cities:Skylines-style utility lens for the real world: click your house, see where
water, sewage, power and roads actually come from — which treatment plant, which
reservoir, which transformer. Starting with one address: F Block, Naraina Vihar,
110028.

**The research that shapes this plan.** I checked what data actually exists before
designing anything:

| Question | Finding |
|---|---|
| Utility features in OSM, all of Delhi NCT | **748 total** — 77 substations with a voltage tag, 61 wastewater plants, 12 water works |
| Utility features within ~4×5 km of Naraina | **4 objects.** One 220 kV substation, two DJB wastewater polygons, one TPDDL substation. Zero transformers, zero pipes, zero valves |
| Buildings in Naraina Vihar | 353 mapped polygons — but **zero `addr:housenumber`** and 3 named roads |
| DJB's 15,600 km pipe network GIS | Built with NIC, internal. Not published |
| BRPL LT feeders / DT locations | Not published. DERC/DTL filings give grid substations only |

Two consequences drive every decision below:

1. **There is no auto-trace.** No API returns "the main that feeds this house." The
   chain must be hand-curated from public documents plus reasoned inference — and
   must *say so, per hop*. Provenance is not a footnote here, it's the core feature.
2. **Address search won't work.** No house numbers in OSM. Selection is pin-drop /
   building-click.

**Decisions made with you:** new public repo `rohan-gulati/utility-lens`; document +
infer with visible confidence labels; **water only, done deep**; Cities:Skylines
overlay aesthetic. If pushing to the new repo is blocked by this session's repo
scope, I stop and tell you rather than building elsewhere.

## The deliverable

A static site where you drop a pin on your building in Naraina Vihar and watch the
water chain light up on a dark map — canal → treatment plant → underground reservoir
→ your street → your tank — with animated flow, a hop-by-hop rail along the bottom,
and a "how do we know this?" mode that dims everything not backed by a citation.

## Step 1 — Create and attach the repo (do this first, it's the gating step)

1. `create_repository` → `utility-lens`, public, no auto-init.
2. `add_repo` with `access: "push"` for `rohan-gulati/utility-lens`.
3. Test-push an empty initial commit **immediately**.

If step 2 or 3 is refused, **stop and report** — per your instruction. Everything
below is wasted effort if the push doesn't land, so this gets verified before any
code is written.

## Step 2 — Stack

Vite + React 18 + TypeScript + Tailwind, matching what you already know from
chrono-canvas-stories, minus shadcn (this UI is bespoke, not form-shaped).

- **Map**: MapLibre GL JS v4. Open, no API key, no token.
- **Basemap**: Carto `dark_all` raster tiles (`basemaps.cartocdn.com`) — keyless,
  reliably dark, gives the C:S night-overlay look out of the box. Attribution in the
  corner as their terms require.
- **Data**: static JSON in `/data`, fetched at runtime. No backend, no database.
- **Deploy**: GitHub Pages via Actions (this repo has no Azure token). Works with a
  static SPA and a `base` path in vite config.

## Step 3 — Data model (`src/data/schema.ts`)

This is the part worth getting right, because it's what makes the project extend to
sewage, power, roads and other cities without a rewrite.

```ts
type Confidence = 'surveyed' | 'documented' | 'inferred';

interface Source {
  id: string;              // 'djb-ace-m8-timings'
  title: string;
  publisher: string;       // 'Delhi Jal Board'
  url?: string;
  archived?: string;       // path under /sources — the snapshot we actually cite
  retrieved: string;       // ISO date
}

interface Asset {
  id: string;
  name: string;
  utility: 'water';        // 'sewage' | 'power' | 'roads' later
  kind: 'source' | 'treatment' | 'transmission' | 'reservoir'
      | 'pumping' | 'distribution' | 'service' | 'storage' | 'fallback';
  geometry: GeoJSON.Point | GeoJSON.Polygon;
  confidence: Confidence;
  sourceIds: string[];
  narrative: string;       // 2-3 sentences: what this does in YOUR chain
  facts?: Record<string, { value: string; confidence: Confidence; sourceIds: string[] }>;
  photos?: { path: string; caption: string; takenAt?: string }[];
}

interface Link {
  id: string;
  from: string; to: string;               // asset ids
  kind: 'canal' | 'trunk_main' | 'feeder_main' | 'distribution' | 'service' | 'tanker';
  geometry: GeoJSON.LineString;
  confidence: Confidence;                  // 'inferred' for every pipe route — see below
  sourceIds: string[];
  routeNote?: string;                      // "Route not published. Drawn along Ring Road,
                                           //  the corridor a trunk main of this size follows."
}

interface Chain {
  id: string;                              // 'naraina-vihar-f-block'
  label: string;
  pin: [number, number];
  utility: 'water';
  hopIds: string[];                        // ordered, source → house
}
```

**Per-field provenance** (`facts`) matters more than per-asset: the *location* of
Haiderpur WTP is documented, its *capacity* is documented, but "it is the plant that
feeds your UGR" may be inferred. One confidence chip per asset would flatten that
distinction and quietly overclaim.

**Every pipe geometry is `inferred` and must render as inferred.** Nobody publishes
the routes. Drawing a confident solid line down a road would be inventing evidence.

## Step 4 — The Naraina Vihar water chain (the actual content)

Draft hops, each to be pinned to a source before it ships:

| # | Hop | Confidence | Source |
|---|---|---|---|
| 1 | Western Yamuna Canal / Munak Canal + Bhakra storage (Haryana) | documented | DJB / MoHUA presentation |
| 2 | **Haiderpur WTP** — 28.7240, 77.1374; treats WJC + Bhakra raw water | documented | OSM way + DJB, cross-check |
| 3 | Trunk main, Haiderpur → west Delhi | **inferred** | route unpublished |
| 4 | **Naraina Cantt BPS + UGR** (also Kirti Nagar UGR) — command area explicitly names Naraina Vihar | documented | DJB ACE(M) zonal timing PDF |
| 5 | Distribution main along Naraina Vihar internal roads | **inferred** | drawn along mapped OSM residential ways |
| 6 | Service connection / ferrule → building underground tank → overhead tank | **surveyed** | your photos + pin, or `inferred` until then |
| 7 | Fallbacks: DJB tanker, borewell, RWA booster | documented | DJB tanker booking |

**Hop 2 needs verification.** Naraina could be fed from Haiderpur or from the
Chandrawal/Wazirabad side — sources conflict, and I will not ship a guess as
documented. Resolution path, in order:

1. `delhijalboard.delhi.gov.in` is **unreachable from this container** (connection
   reset on every attempt — the gov site blocks this egress). First try
   `web.archive.org` mirrors of the ACE(M) timing PDFs.
2. If that fails, I build the chain with hop 2 marked `inferred` and a visible
   "unverified" state in the UI, and ask you to drop the PDFs into `/sources` from
   your machine in Delhi — one command, and it makes the citation permanent anyway.

Archived source snapshots live in `/sources` with a `MANIFEST.md`. Gov PDFs move and
404; citing a live URL alone means the evidence evaporates.

## Step 5 — UI

Full-bleed dark map. Saturated cyan for the water lens. The pieces:

- **`LensSwitcher`** — chunky C:S-style pills. Water live; Sewage / Power / Roads
  visibly present but disabled, so the shape of the idea reads immediately.
- **`PinPicker`** — "F Block, Naraina Vihar" preset plus click-to-drop. Clicking a
  mapped building polygon snaps to it (353 exist; house numbers do not).
- **`MapCanvas`** — assets as pulsing nodes sized by kind; links as lines. Solid =
  documented, dashed = inferred, glowing ring = surveyed.
- **`flowAnimation.ts`** — animated `line-dasharray` offset via `requestAnimationFrame`
  (the standard MapLibre ant-path). Flow runs source → house, speed scaled to link
  kind. This is what sells the C:S feel.
- **`ChainRail`** — hops as cards along the bottom, left to right like a production
  chain. Click → map flies to the hop, panel opens.
- **`AssetPanel`** — narrative, facts with per-fact confidence chips, photos, and a
  citation list that names the document, not just a bare link.
- **`ConfidenceLegend`** + **"How do we know this?"** toggle — dims every inferred
  element so what's actually documented stands alone. The honest heart of the thing,
  and a genuinely interesting interaction.
- **`StatsHud`** — C:S-style readouts: distance from source, plant capacity and
  population served, your supply window, litres/capita/day.

## Step 6 — Guardrails so the data stays trustworthy

- **`scripts/validate-data.ts`** (zod + referential integrity), wired to
  `npm run validate` and CI:
  - every `Link.from`/`to` resolves to an Asset
  - every `sourceIds` entry resolves to a Source
  - **every non-`surveyed` asset and link has ≥1 source** — this is the rule that
    stops the dataset drifting into confident fiction
  - every `Chain.hopIds` forms a connected path through the links
  - every Link with a geometry is `inferred` unless a source explicitly gives a route
- **`.github/workflows/ci.yml`** — build + validate on push and PR.
- **`data/README.md`** — how to add a block, a neighbourhood, a new utility, a new
  city. The extension story, written down while the model is fresh.

## Files

```
utility-lens/
├── index.html, vite.config.ts, tailwind.config.ts, tsconfig.json
├── README.md                    # thesis, data model, honesty policy, how to contribute
├── src/
│   ├── main.tsx  App.tsx
│   ├── data/schema.ts  loader.ts
│   ├── map/MapCanvas.tsx  layers.ts  flowAnimation.ts
│   └── components/LensSwitcher.tsx  PinPicker.tsx  ChainRail.tsx
│                   AssetPanel.tsx  ConfidenceLegend.tsx  StatsHud.tsx
├── data/delhi/water/{assets,links,sources}.json
│   └── chains/naraina-vihar-f-block.json
├── data/README.md
├── sources/MANIFEST.md          # archived PDFs/screenshots
├── scripts/validate-data.ts
└── .github/workflows/ci.yml
```

## Verification

1. `npm run validate` — schema, referential integrity, the ≥1-source rule. Must pass
   before any UI claim is trusted.
2. `npm run dev` → drop the Naraina pin → chain animates source-to-house; every hop
   opens a panel with a citation; "how do we know this?" correctly dims hops 3 and 5.
3. Drive it with Playwright (Chromium is preinstalled here) and screenshot the lit
   chain — I'll send you the screenshot rather than asking you to take my word.
4. `npm run build` clean; CI green.
5. Cross-check every `documented` fact against its archived source one final time.
   Anything I can't back gets demoted to `inferred` and looks inferred on the map.

## What I am explicitly not doing

- Not claiming pipe routes I can't source — they render dashed, always.
- Not building sewage, power or roads yet. The switcher shows them disabled; the
  schema already carries a `utility` field so they're additive, not a rewrite.
- Not scraping or hitting DJB/BRPL systems. Public documents and OSM only.
