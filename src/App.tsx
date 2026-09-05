import { useMemo, useState } from 'react';
import MapCanvas from './map/MapCanvas';
import LensSwitcher from './components/LensSwitcher';
import ChainRail from './components/ChainRail';
import AssetPanel from './components/AssetPanel';
import StatsHud from './components/StatsHud';
import ConfidenceLegend from './components/ConfidenceLegend';
import IntroCard from './components/IntroCard';
import ScopeControl from './components/ScopeControl';
import type { Scope } from './map/layers';
import { assetById, linkBetween, waterDataset } from './data/loader';

export default function App() {
  const chain = waterDataset.chains[0];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flyToId, setFlyToId] = useState<string | null>(null);
  const [evidenceMode, setEvidenceMode] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [scope, setScope] = useState<Scope>('block');

  const selected = selectedId ? assetById.get(selectedId) : undefined;

  /** The link feeding the selected hop — its route note belongs in the panel. */
  const inboundLink = useMemo(() => {
    if (!selectedId) return undefined;
    const i = chain.hopIds.indexOf(selectedId);
    if (i <= 0) return undefined;
    return linkBetween(chain.hopIds[i - 1], selectedId);
  }, [selectedId, chain]);

  const select = (id: string | null) => {
    setSelectedId(id);
    setFlyToId(id);
  };

  return (
    <div className="relative h-full w-full">
      <MapCanvas
        chain={chain}
        assets={waterDataset.assets}
        links={waterDataset.links}
        selectedId={selectedId}
        onSelect={select}
        evidenceMode={evidenceMode}
        flyToId={flyToId}
        scope={scope}
      />

      {/* top left: identity + lens */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-col gap-3">
        <div className="pointer-events-auto panel rounded-xl px-4 py-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-water/70">
            Utility Lens
          </div>
          <div className="mt-1 text-[15px] font-bold leading-tight text-slate-50">
            {chain.label}
          </div>
          {chain.sublabel && (
            <div className="mt-0.5 text-[10px] text-slate-500">{chain.sublabel}</div>
          )}
        </div>
        <div className="pointer-events-auto">
          <LensSwitcher active="water" />
        </div>
        <div className="pointer-events-auto self-start">
          <ScopeControl scope={scope} onChange={setScope} />
        </div>
        <div className="pointer-events-auto w-[228px]">
          <ConfidenceLegend
            evidenceMode={evidenceMode}
            onToggle={() => setEvidenceMode((v) => !v)}
          />
        </div>
      </div>

      {/* bottom: stats + the chain */}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-3">
        <div className="pointer-events-auto self-start">
          <StatsHud chain={chain} />
        </div>
        <div className="pointer-events-auto">
          <ChainRail chain={chain} selectedId={selectedId} onSelect={select} />
        </div>
      </div>

      {selected && (
        <AssetPanel
          asset={selected}
          inboundLink={inboundLink}
          onClose={() => select(null)}
        />
      )}

      {!introDismissed && (
        <IntroCard chain={chain} onDismiss={() => setIntroDismissed(true)} />
      )}
      {!introDismissed && (
        <div
          className="absolute inset-0 z-20 bg-ink-900/60 backdrop-blur-[2px]"
          onClick={() => setIntroDismissed(true)}
        />
      )}
    </div>
  );
}
