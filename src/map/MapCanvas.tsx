import { useEffect, useRef } from 'react';
import maplibregl, { Map as MLMap, Marker } from 'maplibre-gl';
import type { Asset, Chain, Confidence, Link } from '@/data/schema';
import {
  DARK_STYLE,
  SRC_FLOW,
  SRC_LINKS,
  SRC_NODES,
  chainBounds,
  linksToGeoJSON,
  nodesToGeoJSON,
  type Scope,
} from './layers';
import { startFlow, type FlowHandle } from './flowAnimation';

const FIT_PADDING = { top: 90, bottom: 240, left: 90, right: 420 };
const LABEL_GAP_PX = 6;
const LABEL_OFFSET_Y = 14;

interface Props {
  chain: Chain;
  assets: Asset[];
  links: Link[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** "How do we know this?" — dims everything that isn't documented or surveyed. */
  evidenceMode: boolean;
  flyToId: string | null;
  scope: Scope;
}

export default function MapCanvas({
  chain,
  assets,
  links,
  selectedId,
  onSelect,
  evidenceMode,
  flyToId,
  scope,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const flowRef = useRef<FlowHandle | null>(null);
  const readyRef = useRef(false);
  const labelsRef = useRef<
    { marker: Marker; el: HTMLElement; pos: [number, number]; confidence: Confidence }[]
  >([]);
  const declutterRef = useRef<(() => void) | null>(null);
  const evidenceRef = useRef(evidenceMode);
  evidenceRef.current = evidenceMode;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // --- init (once) -----------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      bounds: chainBounds(chain),
      fitBoundsOptions: { padding: FIT_PADDING },
      attributionControl: { compact: true },
      dragRotate: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.touchZoomRotate.disableRotation();

    // 'load' waits for tiles as well as the style, so a blocked or slow basemap
    // host would leave the chain undrawn — the overlay is the content here, the
    // basemap is decoration. 'style.load' fires as soon as the style is parsed.
    const setup = () => {
      map.addSource(SRC_LINKS, { type: 'geojson', data: linksToGeoJSON(links) });
      map.addSource(SRC_NODES, { type: 'geojson', data: nodesToGeoJSON(chain, assets) });

      // Wide, soft under-stroke: reads as a glow around the pipe.
      map.addLayer({
        id: 'link-glow',
        type: 'line',
        source: SRC_LINKS,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['*', ['get', 'width'], 3.2],
          'line-opacity': 0.14,
          'line-blur': 6,
        },
      });

      // The pipe itself. Solid where documented; the dashed overlay below
      // carries the flow and marks inferred geometry.
      map.addLayer({
        id: 'link-base',
        type: 'line',
        source: SRC_LINKS,
        layout: { 'line-cap': 'butt', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': [
            'case',
            ['==', ['get', 'confidence'], 'inferred'], 0.3,
            0.75,
          ],
        },
      });

      map.addLayer({
        id: SRC_FLOW,
        type: 'line',
        source: SRC_LINKS,
        layout: { 'line-cap': 'butt', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['*', ['get', 'width'], 0.8],
          'line-opacity': 0.95,
          'line-dasharray': [0, 0, 3, 2, 5],
        },
      });

      map.addLayer({
        id: 'node-halo',
        type: 'circle',
        source: SRC_NODES,
        paint: {
          'circle-radius': ['*', ['get', 'radius'], 1.9],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.13,
          'circle-blur': 0.65,
        },
      });

      map.addLayer({
        id: 'node-core',
        type: 'circle',
        source: SRC_NODES,
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': '#05080e',
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-width': 2.5,
          'circle-opacity': 0.92,
        },
      });

      // Labels are HTML markers, not a symbol layer: a symbol layer needs a glyph
      // server, which would put a second network dependency in front of the one
      // thing that must always render. These also inherit the UI font for free.
      for (const id of chain.hopIds) {
        const a = assets.find((x) => x.id === id);
        if (!a) continue;
        const el = document.createElement('div');
        el.className = 'pointer-events-none select-none';
        // MapLibre owns the marker element's `transform` AND its `opacity` —
        // it rewrites both every frame for positioning and occlusion. So the
        // offset goes through its offset option, and the text lives in an inner
        // span that MapLibre never touches, which is what decluttering hides.
        const inner = document.createElement('span');
        inner.style.cssText =
          'display:block;transition:opacity .18s;font:600 11px/1.25 "DM Sans",system-ui,sans-serif;' +
          'color:#cfe3f2;text-shadow:0 0 4px #05080e,0 0 8px #05080e;max-width:120px;text-align:center';
        inner.textContent = a.name;
        el.appendChild(inner);
        const marker = new Marker({ element: el, anchor: 'top', offset: [0, LABEL_OFFSET_Y] })
          .setLngLat(a.position)
          .addTo(map);
        labelsRef.current.push({ marker, el: inner, pos: a.position, confidence: a.confidence });
      }

      flowRef.current = startFlow(map, SRC_FLOW);

      for (const id of ['node-core', 'node-halo']) {
        map.on('click', id, (e) => {
          const f = e.features?.[0];
          if (f) onSelectRef.current(String(f.properties?.id));
        });
        map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''));
      }
      map.on('click', (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ['node-core', 'node-halo'] });
        if (!hits.length) onSelectRef.current(null);
      });

      // The house.
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="position:relative;width:26px;height:26px">
          <div style="position:absolute;inset:0;border-radius:99px;background:#22d3ee;opacity:.35;animation:pulse-ring 2.4s ease-out infinite"></div>
          <div style="position:absolute;inset:7px;border-radius:99px;background:#67e8f9;box-shadow:0 0 14px #22d3ee"></div>
        </div>`;
      new Marker({ element: el }).setLngLat(chain.pin).addTo(map);

      readyRef.current = true;
      if (import.meta.env.DEV) (window as unknown as { __map?: MLMap }).__map = map;

      // Styles arrive asynchronously in dev, so the container can still be
      // zero-height at construction — MapLibre then falls back to a 400x300
      // canvas and the constructor's `bounds` resolves against nothing. Sizing
      // to the container and fitting explicitly makes the first frame correct
      // regardless of when the CSS lands.
      map.resize();
      map.fitBounds(chainBounds(chain, 'block'), { padding: FIT_PADDING, duration: 0 });

      // With hops 30 m apart and hops 120 km apart on the same map, labels pile
      // into an unreadable smear at most zooms. Hide any label whose node is
      // within LABEL_MIN_PX of one already shown, nearest-to-the-house first —
      // the local end is what the reader came for.
      const declutter = () => {
        // Boxes are derived from map.project() plus each label's own measured
        // size, not from getBoundingClientRect(). MapLibre writes marker
        // transforms during its own render pass, so reading them back is always
        // a frame behind the map state — which leaves a settled map wearing the
        // layout of the view it just left. Projecting directly has no such lag.
        const shown: { l: number; r: number; t: number; b: number }[] = [];
        for (let i = labelsRef.current.length - 1; i >= 0; i--) {
          const { el, pos, confidence } = labelsRef.current[i];
          // Evidence mode fades the unsourced hops out, but they still occupy
          // their box — a faded label must not let a neighbour overlap it.
          const faded = evidenceRef.current && confidence === 'inferred';
          const p = map.project(pos);
          const w = el.offsetWidth || 120;
          const h = el.offsetHeight || 28;
          // anchor 'top' with a [0, LABEL_OFFSET_Y] offset: centred horizontally,
          // hanging below the node.
          const box = {
            l: p.x - w / 2,
            r: p.x + w / 2,
            t: p.y + LABEL_OFFSET_Y,
            b: p.y + LABEL_OFFSET_Y + h,
          };
          const clash = shown.some(
            (s) =>
              box.l < s.r + LABEL_GAP_PX &&
              box.r + LABEL_GAP_PX > s.l &&
              box.t < s.b + LABEL_GAP_PX &&
              box.b + LABEL_GAP_PX > s.t,
          );
          el.style.opacity = clash ? '0' : faded ? '0.12' : '1';
          if (!clash) shown.push(box);
        }
      };

      // MapLibre repositions markers during the render that follows a move
      // event, so measuring inside the handler reads the previous frame's
      // layout — which is how a settled map ends up with labels laid out for
      // a view it has already left. Coalesce into the next frame instead, which
      // also collapses a 60 fps stream of move events into one pass per frame.
      let scheduled = false;
      const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          declutter();
        });
      };

      declutterRef.current = schedule;
      schedule();
      for (const ev of ['move', 'moveend', 'zoom', 'resize', 'idle'] as const) {
        map.on(ev, schedule);
      }
    };

    if (map.isStyleLoaded()) setup();
    else map.once('style.load', setup);

    const ro = new ResizeObserver(() => {
      if (!mapRef.current) return;
      mapRef.current.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      declutterRef.current = null;
      for (const l of labelsRef.current) l.marker.remove();
      labelsRef.current = [];
      flowRef.current?.stop();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // Built once; subsequent prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- evidence mode + selection ---------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const dim = evidenceMode ? 0.07 : null;

    if (map.getLayer('link-base')) {
      map.setPaintProperty('link-base', 'line-opacity',
        evidenceMode
          ? ['case', ['==', ['get', 'confidence'], 'inferred'], dim!, 0.85]
          : ['case', ['==', ['get', 'confidence'], 'inferred'], 0.3, 0.75]);
    }
    if (map.getLayer(SRC_FLOW)) {
      map.setPaintProperty(SRC_FLOW, 'line-opacity',
        evidenceMode
          ? ['case', ['==', ['get', 'confidence'], 'inferred'], dim!, 0.95]
          : 0.95);
    }
    if (map.getLayer('node-core')) {
      // The ring is what actually reads as the node; fading only the fill
      // leaves an inferred hop looking just as certain as a documented one.
      map.setPaintProperty('node-core', 'circle-stroke-opacity',
        evidenceMode
          ? ['case', ['==', ['get', 'confidence'], 'inferred'], 0.12, 1]
          : 1);
    }
    declutterRef.current?.();

    for (const layer of ['node-core', 'node-halo'] as const) {
      if (!map.getLayer(layer)) continue;
      const prop = 'circle-opacity';
      const base = layer === 'node-core' ? 0.92 : 0.13;
      map.setPaintProperty(layer, prop,
        evidenceMode
          ? ['case', ['==', ['get', 'confidence'], 'inferred'], 0.1, base]
          : base);
    }

    // Selected node grows and brightens.
    if (map.getLayer('node-core')) {
      map.setPaintProperty('node-core', 'circle-stroke-width',
        selectedId ? ['case', ['==', ['get', 'id'], selectedId], 5, 2.5] : 2.5);
      map.setPaintProperty('node-core', 'circle-radius',
        selectedId
          ? ['case', ['==', ['get', 'id'], selectedId], ['*', ['get', 'radius'], 1.35], ['get', 'radius']]
          : ['get', 'radius']);
    }
  }, [evidenceMode, selectedId]);

  // --- scope framing ----------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.fitBounds(chainBounds(chain, scope), { padding: FIT_PADDING, duration: 1100 });
    map.once('moveend', () => declutterRef.current?.());
  }, [scope, chain]);

  // --- fly to a hop -----------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !flyToId) return;
    const asset = assets.find((a) => a.id === flyToId);
    if (!asset) return;
    map.flyTo({ center: asset.position, zoom: Math.max(map.getZoom(), 12.5), duration: 1400, essential: true });
  }, [flyToId, assets]);

  // Inline rather than utility classes: maplibre-gl.css also styles this node,
  // and the map silently collapses to a 400x300 canvas if it ever wins.
  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}
