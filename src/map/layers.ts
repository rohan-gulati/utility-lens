import type { FeatureCollection, LineString, Point } from 'geojson';
import type { Asset, Chain, Confidence, Link } from '@/data/schema';
import { CONFIDENCE_META, KIND_META } from '@/data/schema';
import { assetById } from '@/data/loader';

export const SRC_LINKS = 'chain-links';
export const SRC_FLOW = 'chain-flow';
export const SRC_NODES = 'chain-nodes';

export function linksToGeoJSON(links: Link[]): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: links.map((l) => ({
      type: 'Feature',
      id: l.id,
      geometry: { type: 'LineString', coordinates: l.path },
      properties: {
        id: l.id,
        kind: l.kind,
        confidence: l.confidence,
        color: CONFIDENCE_META[l.confidence as Confidence].color,
        // Trunk mains read heavier than a service pipe, as on a real schematic.
        width: l.kind === 'canal' || l.kind === 'trunk_main' ? 4.5 : l.kind === 'tanker' ? 2 : 3,
      },
    })),
  };
}

export function nodesToGeoJSON(chain: Chain, assets: Asset[]): FeatureCollection<Point> {
  const inChain = new Set(chain.hopIds);
  return {
    type: 'FeatureCollection',
    features: assets.map((a) => ({
      type: 'Feature',
      id: a.id,
      geometry: { type: 'Point', coordinates: a.position },
      properties: {
        id: a.id,
        name: a.name,
        kind: a.kind,
        confidence: a.confidence,
        color: CONFIDENCE_META[a.confidence].color,
        radius: KIND_META[a.kind].radius,
        inChain: inChain.has(a.id),
        hopIndex: chain.hopIds.indexOf(a.id),
      },
    })),
  };
}

export type Scope = 'block' | 'city' | 'whole';

/**
 * The chain spans 200 km at one end and 30 m at the other, so no single view
 * shows it. These three framings are the honest answer: start at the house,
 * and let the reader pull back to see how far the water has come.
 */
export const SCOPES: { id: Scope; label: string; hops: number }[] = [
  { id: 'block', label: 'Your block', hops: 4 },
  { id: 'city', label: 'Delhi', hops: 5 },
  { id: 'whole', label: 'Whole chain', hops: Infinity },
];

/** Bounds fitting the last `hops` hops of a chain (or all of them), plus the pin. */
export function chainBounds(
  chain: Chain,
  scope: Scope = 'whole',
): [[number, number], [number, number]] {
  const n = SCOPES.find((s) => s.id === scope)?.hops ?? Infinity;
  const ids = Number.isFinite(n) ? chain.hopIds.slice(-n) : chain.hopIds;
  const pts: [number, number][] = [chain.pin];
  for (const id of ids) {
    const a = assetById.get(id);
    if (a) pts.push(a.position);
  }
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}

/**
 * Carto's keyless dark basemap. Chosen over a vector style because it needs no
 * API token and its darkness is stable — a utility overlay is unreadable on a
 * basemap that competes with it for attention.
 */
export const DARK_STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    { id: 'bg', type: 'background' as const, paint: { 'background-color': '#05080e' } },
    {
      id: 'carto',
      type: 'raster' as const,
      source: 'carto',
      paint: { 'raster-opacity': 0.75, 'raster-saturation': -0.35 },
    },
  ],
};
