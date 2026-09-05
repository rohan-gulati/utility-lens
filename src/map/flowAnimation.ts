import type { Map as MLMap } from 'maplibre-gl';

/**
 * The moving dashes that make the chain read as flow rather than as a route.
 *
 * MapLibre has no dash-offset property, so the standard trick is to cycle a set
 * of pre-computed dasharray patterns: each frame shifts where the gaps fall, and
 * the eye integrates that into motion. Rebuilding the array every frame would
 * thrash the style, so the patterns are computed once and stepped through.
 */
const STEPS = 8;
const DASH = 3;
const GAP = 2;

function buildPatterns(): number[][] {
  const total = DASH + GAP;
  const out: number[][] = [];
  for (let i = 0; i < STEPS; i++) {
    const shift = (total * i) / STEPS;
    // Lead with a partial gap so the pattern appears to slide forward.
    out.push([0, shift, DASH, GAP, total - shift]);
  }
  return out;
}

const PATTERNS = buildPatterns();

export interface FlowHandle {
  stop: () => void;
  setSpeed: (msPerStep: number) => void;
}

export function startFlow(map: MLMap, layerId: string, msPerStep = 90): FlowHandle {
  let raf = 0;
  let last = 0;
  let step = 0;
  let speed = msPerStep;
  let stopped = false;

  const tick = (now: number) => {
    if (stopped) return;
    if (now - last >= speed) {
      last = now;
      step = (step + 1) % PATTERNS.length;
      // The layer can vanish on a style reload; failing quietly beats throwing
      // inside an animation frame.
      if (map.getLayer(layerId)) {
        try {
          map.setPaintProperty(layerId, 'line-dasharray', PATTERNS[step]);
        } catch {
          /* layer torn down mid-frame */
        }
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(raf);
    },
    setSpeed: (ms: number) => {
      speed = ms;
    },
  };
}
