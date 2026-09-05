# Utility Lens

A Cities:Skylines-style utility lens for the real world. Pick a house, see where its
water actually comes from — which canal, which treatment plant, which reservoir —
with a citation and a confidence level on every hop.

The first chain is **F Block, Naraina Vihar, New Delhi 110028**: seven hops from a
barrage in Haryana to a tank on a roof.

## The problem this is built around

You cannot look this up. Before writing any code, we checked what data exists:

| | |
|---|---|
| Utility features in OpenStreetMap, all of Delhi NCT | **748** |
| Utility features within 4.5 × 5.5 km of Naraina Vihar | **4** |
| Transformers, pipes or valves mapped near the study area | **0** |
| Buildings mapped in Naraina Vihar | 353 — with **zero** house numbers |
| DJB's 15,600 km pipe network GIS | Built with NIC. Internal, never released |
| BRPL's LT feeders and distribution transformers | Not published |

So there is no auto-trace to build, and no address search to build it on. A chain from
a treatment plant to a house is necessarily part document, part inference.

That constraint is the design. **The project's job is not to know where the pipe runs —
it is to be honest about which parts we know and which parts we are reasoning.** Every
hop carries one of three levels:

- **Documented** — a source we actually retrieved and archived says so. Not "a search
  result summarised a PDF"; the PDF is in [`/sources`](./sources).
- **Surveyed** — somebody stood in front of it and photographed it.
- **Inferred** — reasoned from how the system is known to work. Not evidence.

Hit **"How do we know this?"** in the app and everything inferred fades out. What's
left is the part a document supports. On the Naraina water chain today, that is two
hops out of seven.

## What the chain shows

Delhi's water is not a river supply, it is a canal supply that Haryana turns on. And
under DJB's three-tier model the treatment plant never feeds your house — it fills an
underground reservoir, and your block is pumped from there on a timetable. That is why
Delhi houses are all their own reservoir operators, with a tank below and a tank above.

The chain ends at a brass fitting. DJB's position is that the service connection from
the ferrule to the meter belongs to the consumer — so a 200 km public water system
formally stops at your outside wall.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm run validate   # data integrity gate
npm run build      # validate, typecheck, bundle
```

No API keys, no backend, no database. The basemap is Carto's keyless dark raster; if
that host is unreachable the chain still renders, because the overlay is the content
and the basemap is decoration.

## How it is put together

```
data/<city>/<utility>/     sources.json, assets.json, links.json, chains/*.json
src/data/schema.ts         the model: Confidence, Source, Fact, Asset, Link, Chain
src/map/                   MapLibre layers, flow animation, label decluttering
src/components/            lens switcher, chain rail, asset panel, evidence legend
scripts/validate-data.mjs  the integrity gate (runs on every build and in CI)
sources/                   archived documents, Overpass queries, PDF decoder
```

Provenance is tracked **per fact**, not per asset. Haiderpur's location and capacity
are documented; the claim that it is *your* plant is not — and one confidence chip for
the whole asset would quietly launder the second claim into the first.

The validator refuses to let that slip. Its load-bearing rule: nothing may be marked
`documented` without naming a source, and no drawn line may exist without a note
saying what the line is and — more importantly — what it is not. A route on a map
reads as evidence whether or not it is any.

## Adding to it

Sewage, power and roads are visible but disabled in the lens switcher. They are
additive, not a rewrite: the schema already carries a `utility` field, and the
validator already walks every city and utility it finds under `data/`.

See [`data/README.md`](./data/README.md) to add a block, a utility, or a city, and
[`sources/MANIFEST.md`](./sources/MANIFEST.md) for what is archived — including the
one missing document that would upgrade three of Naraina's inferred facts in a single
step.

## Licence and attribution

Map data © OpenStreetMap contributors (ODbL). Basemap © CARTO. Source documents are
Government of NCT of Delhi and Government of India publications, archived here for
citation.
