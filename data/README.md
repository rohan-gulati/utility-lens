# The data

Everything the app shows lives here. No code changes are needed to add a block, a
utility, or a city — only JSON, and sources to back it.

```
data/<city>/<utility>/
  sources.json          documents we retrieved. Nothing is cited that isn't here.
  assets.json           the things: canals, plants, reservoirs, mains, your tank
  links.json            what connects to what, and the drawn route between them
  chains/<id>.json      one address: a pin and an ordered list of hops
```

`src/data/schema.ts` is the authority on shapes. `npm run validate` enforces them.

## The rules the validator enforces

These exist because the project is worth nothing if the confidence levels drift.

- **CLAIM** — an asset, fact or link marked `documented` must name at least one
  source. Cite it or mark it `inferred`. There is no third option.
- **ROUTE_UNEXPLAINED** — any link whose geometry isn't `surveyed` must carry a
  `routeNote` saying what the drawn line is and what it is not. Lines on maps read as
  evidence; an invented route has to say it is invented.
- **DANGLING_SOURCE / DANGLING_LINK / DANGLING_HOP** — every id resolves.
- **CHAIN_BREAK** — consecutive hops in a chain are joined by an actual link.
- **NO_PENDING_NOTE** (warning) — an `inferred` asset should say what would resolve
  it, so the gaps are a to-do list rather than a shrug.

## Confidence

| Level | Means | Test |
|---|---|---|
| `surveyed` | Somebody photographed it | Is there a photo? |
| `documented` | A retrieved, archived source says so | Is the file in `/sources`? |
| `inferred` | Reasoned from how the system works | Everything else |

A source you believe exists but could not retrieve is **`inferred`**, not
`documented`. Under-claiming is the only safe direction to be wrong in. Put the
document you need in `pendingNote` so the gap is actionable — see
`ugr-naraina-cantt` for the pattern.

## Adding a hop

1. Add the document to `sources.json` with an `archived` snapshot URL, not just a
   live one. Government PDFs move.
2. Add the asset with a `narrative` — two or three sentences on what this thing does
   *in this chain*, in plain language. This is the part people read.
3. Put individual claims in `facts[]`, each with its own confidence and sources. An
   asset is rarely uniformly known: its location may be documented while its role in
   your chain is a guess.
4. Add a link to the previous hop, with a `routeNote`.
5. Add the asset id to the chain's `hopIds`, in order.
6. `npm run validate`.

## Adding a utility or a city

Create `data/<city>/<utility>/` with the four files. The validator walks every
directory it finds; the loader currently imports Delhi water explicitly
(`src/data/loader.ts`), and the lens switcher lists the utilities it will show.

## Surveying the last mile

The last hops of any chain — the main under your street, the ferrule, your tank —
are not published anywhere and never will be. They are, however, twenty minutes and a
phone camera away. Photograph the meter and the valve chamber, note the position, and
a hop moves from `inferred` to `surveyed`: the one kind of evidence a document cannot
give you, and the only one you can create yourself.
