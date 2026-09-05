import type { Asset, Chain, Link, Source, UtilityDataset } from './schema';

import sources from '@data/delhi/water/sources.json';
import assets from '@data/delhi/water/assets.json';
import links from '@data/delhi/water/links.json';
import narainaChain from '@data/delhi/water/chains/naraina-vihar-f-block.json';

/**
 * Data is imported rather than fetched: the site is static, the dataset is small,
 * and a build-time import means a malformed file fails the build instead of
 * blanking the map in front of a visitor.
 */
export const waterDataset: UtilityDataset = {
  sources: sources as Source[],
  assets: assets as Asset[],
  links: links as Link[],
  chains: [narainaChain as Chain],
};

export const assetById = new Map(waterDataset.assets.map((a) => [a.id, a]));
export const sourceById = new Map(waterDataset.sources.map((s) => [s.id, s]));

/** The link joining two hops, in either direction. */
export function linkBetween(a: string, b: string): Link | undefined {
  return waterDataset.links.find(
    (l) => (l.from === a && l.to === b) || (l.from === b && l.to === a),
  );
}

/** Ordered links along a chain. */
export function chainLinks(chain: Chain): Link[] {
  const out: Link[] = [];
  for (let i = 0; i < chain.hopIds.length - 1; i++) {
    const l = linkBetween(chain.hopIds[i], chain.hopIds[i + 1]);
    if (l) out.push(l);
  }
  return out;
}

/** Great-circle distance in km. */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Length of a drawn path, summed segment by segment. */
export function pathLengthKm(path: [number, number][]): number {
  let km = 0;
  for (let i = 0; i < path.length - 1; i++) km += haversineKm(path[i], path[i + 1]);
  return km;
}
