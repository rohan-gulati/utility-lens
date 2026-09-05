# Sources

Every claim marked **documented** in `/data` points at something in here. Government
PDFs move and 404 — a live URL is not a durable citation — so what we actually read
is archived alongside the data.

## `djb/`

| File | What it is | How it was obtained |
|---|---|---|
| `ace_m_8.pdf` | Water supply timings for ACE (M)-8, dated 2021-11-25 | Wayback snapshot `20260103100931` of `delhijalboard.delhi.gov.in/sites/default/files/ace_m_8_0.pdf` |
| `ace_m_8.txt` | Decoded text of the above | `python3 sources/tools/pdftext.py sources/djb/ace_m_8.pdf` |
| `djb-mohua-presentation.txt` | Decoded text of "Towards Rational Capital Water Supply System", DJB's presentation to MoHUA (c. 2011) | Wayback snapshot `20250505220728` of `mohua.gov.in/upload/uploadfiles/files/DJB_Water_PPT_1.pdf`. The PDF itself is 2.9 MB and lives at that permanent URL; only the extracted text is committed. |

### Why there is a PDF extractor in here

Both DJB documents embed subset fonts with custom encodings. Copy-paste and most
off-the-shelf extractors return mojibake — `\r ! ; % # 0` where the document says
`Garden`. `sources/tools/pdftext.py` reads each font's `/ToUnicode` CMap and maps the
glyph codes back to characters, which is what makes these documents quotable at all.

## `osm/`

The exact Overpass queries behind the OpenStreetMap claims, so the counts can be
re-run rather than taken on trust. Run them at <https://overpass-turbo.eu>.

Results as of 2026-09-05:

- `delhi-utilities.overpassql` — **748** utility features in the whole of Delhi NCT
  (77 substations carrying a voltage tag, 61 wastewater plants, 12 water works).
- `naraina-utilities.overpassql` — **4** features in the 4.5 × 5.5 km box around
  Naraina Vihar. No transformers, no pipes, no valves.
- `naraina-basemap.overpassql` — 353 building polygons and 96 residential ways in
  the F Block area, with **zero** `addr:housenumber` tags and three named roads.

## Missing, and it matters

**`ace_m_5_0.pdf` — DJB water supply timings for ACE (M)-5.**

ACE (M)-5 covers AC 38 Delhi Cantonment, which contains Naraina Vihar. It is the one
document that would name the reservoir feeding F Block, its command area, and the
supply timings — three claims currently held at `inferred` for want of it.

It is also the only zonal sheet with **no Wayback snapshot**, and
`delhijalboard.delhi.gov.in` refuses connections from the build environment this was
assembled in. Every other ACE (M) sheet was retrieved and checked: none of them
mentions Naraina.

To close the gap, from a connection that can reach the site:

```sh
curl -o sources/djb/ace_m_5.pdf \
  https://delhijalboard.delhi.gov.in/sites/default/files/ace_m_5_0.pdf
python3 sources/tools/pdftext.py sources/djb/ace_m_5.pdf > sources/djb/ace_m_5.txt
grep -i naraina sources/djb/ace_m_5.txt
```

Then add it to `data/delhi/water/sources.json` and raise the affected facts on
`ugr-naraina-cantt` from `inferred` to `documented`.
