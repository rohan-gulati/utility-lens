/**
 * The data model for a utility lens.
 *
 * The governing idea: nobody publishes the last mile. DJB's 15,600 km pipe GIS is
 * internal, BRPL's LT feeders are internal, and OpenStreetMap holds 748 utility
 * features for all of Delhi. So a chain from a treatment plant to a house is
 * necessarily part document, part inference — and the model's job is to keep those
 * two things visibly separate, at the granularity of the individual fact.
 */

export type Utility = 'water' | 'sewage' | 'power' | 'roads';

/**
 * How well do we know this?
 *
 *  - `documented` — a source we actually retrieved and archived says so. Not "a
 *    search result summarised a PDF"; the PDF is in /sources.
 *  - `surveyed`   — somebody stood in front of it and photographed it.
 *  - `inferred`   — reasoned from how the system is known to work. Honest guess.
 *
 * Anything that isn't `documented` or `surveyed` is `inferred`, including facts
 * that a source probably supports but that we could not retrieve. Under-claiming
 * is the only safe direction to be wrong in.
 */
export type Confidence = 'surveyed' | 'documented' | 'inferred';

export const CONFIDENCE_ORDER: Confidence[] = ['inferred', 'documented', 'surveyed'];

export interface Source {
  id: string;
  title: string;
  publisher: string;
  /** Live URL. Government PDFs move; this alone is not a durable citation. */
  url?: string;
  /** Wayback or other permanent snapshot — what we actually read. */
  archived?: string;
  /** Publication date of the document, not of our retrieval. */
  published?: string;
  retrieved: string;
  /** Vintage caveats, scope limits, anything that qualifies how far it can be pushed. */
  note?: string;
}

/** A single claim, with its own provenance. */
export interface Fact {
  label: string;
  value: string;
  confidence: Confidence;
  sourceIds: string[];
  note?: string;
}

export type AssetKind =
  | 'catchment'    // river, canal head, aquifer
  | 'conveyance'   // canal carrying raw water toward the city
  | 'treatment'    // WTP
  | 'reservoir'    // UGR
  | 'pumping'      // BPS / booster
  | 'distribution' // DMA-level main
  | 'service'      // the connection into one property
  | 'storage'      // your tank
  | 'fallback';    // tanker, borewell

export interface Asset {
  id: string;
  name: string;
  utility: Utility;
  kind: AssetKind;
  /** [lon, lat] — GeoJSON order. */
  position: [number, number];
  confidence: Confidence;
  sourceIds: string[];
  /** What this thing does in *your* chain, in plain language. */
  narrative: string;
  facts?: Fact[];
  /**
   * Where the identity of the asset itself is unresolved: the real network has
   * one of these, and we cannot yet say which. Rendering must not pick a winner.
   */
  candidates?: { name: string; note: string }[];
  /** Exactly which document would raise this hop's confidence, and how to get it. */
  pendingNote?: string;
  operator?: string;
  photos?: { path: string; caption: string; takenAt?: string }[];
}

export type LinkKind =
  | 'canal'
  | 'trunk_main'
  | 'feeder_main'
  | 'distribution'
  | 'service'
  | 'tanker';

export interface Link {
  id: string;
  from: string;
  to: string;
  kind: LinkKind;
  /** [lon, lat][] — drawn route. Almost always inferred; see routeNote. */
  path: [number, number][];
  confidence: Confidence;
  sourceIds: string[];
  /**
   * Required whenever the geometry is inferred. Says what the drawn line is and
   * — more importantly — what it is not. A line on a map reads as evidence
   * whether or not it is any, so every invented route has to say so here.
   */
  routeNote?: string;
  lengthNote?: string;
}

export interface Chain {
  id: string;
  label: string;
  sublabel?: string;
  utility: Utility;
  /** The house. [lon, lat]. */
  pin: [number, number];
  /** Ordered source -> house. */
  hopIds: string[];
}

export interface UtilityDataset {
  sources: Source[];
  assets: Asset[];
  links: Link[];
  chains: Chain[];
}

export const CONFIDENCE_META: Record<
  Confidence,
  { label: string; color: string; blurb: string }
> = {
  surveyed: {
    label: 'Surveyed',
    color: '#4ade80',
    blurb: 'Someone stood in front of it and photographed it.',
  },
  documented: {
    label: 'Documented',
    color: '#22d3ee',
    blurb: 'A source we retrieved and archived says so.',
  },
  inferred: {
    label: 'Inferred',
    color: '#fbbf24',
    blurb: 'Reasoned from how the system works. Not evidence.',
  },
};

export const KIND_META: Record<AssetKind, { label: string; radius: number }> = {
  catchment: { label: 'Catchment', radius: 13 },
  conveyance: { label: 'Conveyance', radius: 10 },
  treatment: { label: 'Treatment plant', radius: 16 },
  reservoir: { label: 'Reservoir', radius: 13 },
  pumping: { label: 'Pumping station', radius: 11 },
  distribution: { label: 'Distribution main', radius: 9 },
  service: { label: 'Service connection', radius: 8 },
  storage: { label: 'Your storage', radius: 11 },
  fallback: { label: 'Fallback supply', radius: 9 },
};
