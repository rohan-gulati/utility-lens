#!/usr/bin/env node
/**
 * Data integrity gate.
 *
 * The point of this project is that you can tell what is known from what is
 * guessed. That property is only as good as the discipline behind it, so these
 * checks run in CI and on every build. The load-bearing rule is CLAIM: nothing
 * may be marked `documented` without naming a source we actually hold.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (code, msg) => errors.push(`${code}  ${msg}`);
const warn = (code, msg) => warnings.push(`${code}  ${msg}`);

const CONFIDENCE = new Set(['surveyed', 'documented', 'inferred']);
const KINDS = new Set(['catchment', 'conveyance', 'treatment', 'reservoir',
  'pumping', 'distribution', 'service', 'storage', 'fallback']);
const LINK_KINDS = new Set(['canal', 'trunk_main', 'feeder_main', 'distribution',
  'service', 'tanker']);

const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const cities = readdirSync(join(root, 'data'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let checked = 0;

for (const city of cities) {
  const utilDir = join(root, 'data', city);
  for (const util of readdirSync(utilDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    const base = `data/${city}/${util}`;
    const sources = read(`${base}/sources.json`);
    const assets = read(`${base}/assets.json`);
    const links = read(`${base}/links.json`);
    const chainDir = join(root, base, 'chains');
    const chains = existsSync(chainDir)
      ? readdirSync(chainDir).filter((f) => f.endsWith('.json')).map((f) => read(`${base}/chains/${f}`))
      : [];

    const sourceIds = new Set(sources.map((s) => s.id));
    const assetIds = new Set(assets.map((a) => a.id));

    // --- sources -------------------------------------------------------
    for (const s of sources) {
      if (!s.title || !s.publisher) err('SOURCE_INCOMPLETE', `${base} ${s.id}: needs title and publisher`);
      if (!s.retrieved) err('SOURCE_NO_RETRIEVED', `${base} ${s.id}: needs a retrieved date`);
      if (!s.archived && s.url) {
        warn('SOURCE_NOT_ARCHIVED', `${base} ${s.id}: no archived snapshot — a live gov URL is not a durable citation`);
      }
    }
    const dupSources = sources.map((s) => s.id).filter((id, i, a) => a.indexOf(id) !== i);
    if (dupSources.length) err('SOURCE_DUP_ID', `${base}: duplicate source ids ${[...new Set(dupSources)].join(', ')}`);

    // --- assets --------------------------------------------------------
    for (const a of assets) {
      checked++;
      if (!CONFIDENCE.has(a.confidence)) err('BAD_CONFIDENCE', `${base} asset ${a.id}: "${a.confidence}"`);
      if (!KINDS.has(a.kind)) err('BAD_KIND', `${base} asset ${a.id}: "${a.kind}"`);
      if (!Array.isArray(a.position) || a.position.length !== 2) err('BAD_POSITION', `${base} asset ${a.id}`);
      else {
        const [lon, lat] = a.position;
        if (lon < -180 || lon > 180 || lat < -90 || lat > 90) err('POSITION_RANGE', `${base} asset ${a.id}: ${lon},${lat}`);
        // Delhi sanity: everything should be in northern India.
        if (lon < 68 || lon > 90 || lat < 8 || lat > 37) warn('POSITION_ODD', `${base} asset ${a.id} is outside India: ${lon},${lat}`);
      }
      if (!a.narrative || a.narrative.length < 20) err('NO_NARRATIVE', `${base} asset ${a.id}: needs a narrative`);
      for (const sid of a.sourceIds ?? []) {
        if (!sourceIds.has(sid)) err('DANGLING_SOURCE', `${base} asset ${a.id} -> unknown source "${sid}"`);
      }
      // THE RULE.
      if (a.confidence === 'documented' && !(a.sourceIds ?? []).length) {
        err('CLAIM', `${base} asset ${a.id} is "documented" with no source. Either cite it or mark it inferred.`);
      }
      if (a.confidence === 'inferred' && !a.pendingNote && !a.candidates) {
        warn('NO_PENDING_NOTE', `${base} asset ${a.id} is inferred but does not say what would resolve it`);
      }
      for (const f of a.facts ?? []) {
        if (!CONFIDENCE.has(f.confidence)) err('BAD_CONFIDENCE', `${base} fact ${a.id}/${f.label}`);
        for (const sid of f.sourceIds ?? []) {
          if (!sourceIds.has(sid)) err('DANGLING_SOURCE', `${base} fact ${a.id}/${f.label} -> unknown source "${sid}"`);
        }
        if (f.confidence === 'documented' && !(f.sourceIds ?? []).length) {
          err('CLAIM', `${base} fact ${a.id}/"${f.label}" is "documented" with no source.`);
        }
      }
    }
    const dupAssets = assets.map((a) => a.id).filter((id, i, arr) => arr.indexOf(id) !== i);
    if (dupAssets.length) err('ASSET_DUP_ID', `${base}: duplicate asset ids ${[...new Set(dupAssets)].join(', ')}`);

    // --- links ---------------------------------------------------------
    for (const l of links) {
      checked++;
      if (!assetIds.has(l.from)) err('DANGLING_LINK', `${base} link ${l.id}: from "${l.from}" does not exist`);
      if (!assetIds.has(l.to)) err('DANGLING_LINK', `${base} link ${l.id}: to "${l.to}" does not exist`);
      if (!LINK_KINDS.has(l.kind)) err('BAD_LINK_KIND', `${base} link ${l.id}: "${l.kind}"`);
      if (!Array.isArray(l.path) || l.path.length < 2) err('BAD_PATH', `${base} link ${l.id}: needs >= 2 points`);
      for (const sid of l.sourceIds ?? []) {
        if (!sourceIds.has(sid)) err('DANGLING_SOURCE', `${base} link ${l.id} -> unknown source "${sid}"`);
      }
      if (l.confidence === 'documented' && !(l.sourceIds ?? []).length) {
        err('CLAIM', `${base} link ${l.id} is "documented" with no source.`);
      }
      // A drawn line reads as evidence whether or not it is any.
      if (l.confidence !== 'surveyed' && !l.routeNote) {
        err('ROUTE_UNEXPLAINED', `${base} link ${l.id}: geometry is not surveyed, so routeNote must say what the line is and is not.`);
      }
    }

    // --- chains --------------------------------------------------------
    for (const c of chains) {
      checked++;
      if (!c.hopIds?.length) err('EMPTY_CHAIN', `${base} chain ${c.id}`);
      for (const h of c.hopIds ?? []) {
        if (!assetIds.has(h)) err('DANGLING_HOP', `${base} chain ${c.id} -> unknown asset "${h}"`);
      }
      // Consecutive hops must be joined by a link, in either direction.
      const joined = new Set(links.flatMap((l) => [`${l.from}>${l.to}`, `${l.to}>${l.from}`]));
      for (let i = 0; i < (c.hopIds?.length ?? 0) - 1; i++) {
        const pair = `${c.hopIds[i]}>${c.hopIds[i + 1]}`;
        if (!joined.has(pair)) err('CHAIN_BREAK', `${base} chain ${c.id}: no link joins ${c.hopIds[i]} -> ${c.hopIds[i + 1]}`);
      }
      if (!Array.isArray(c.pin) || c.pin.length !== 2) err('BAD_PIN', `${base} chain ${c.id}`);
    }
  }
}

for (const w of warnings) console.warn(`  warn  ${w}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`✓ data valid — ${checked} records checked, ${warnings.length} warning(s)`);
