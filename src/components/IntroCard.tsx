import type { Chain } from '@/data/schema';

export default function IntroCard({
  chain,
  onDismiss,
}: {
  chain: Chain;
  onDismiss: () => void;
}) {
  return (
    <div className="panel absolute left-1/2 top-1/2 z-30 w-[440px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-water/70">
        Utility Lens · Delhi
      </div>
      <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-50">
        Where does the water in {chain.label} come from?
      </h1>
      <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
        Seven hops from a barrage in Haryana to a tank on a roof in Naraina Vihar. Some of
        it is documented; most of the last mile is not published by anyone, so this traces
        what can be sourced and marks the rest as reasoning.
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
        Click any hop for its evidence — or hit{' '}
        <span className="text-water">How do we know this?</span> to dim everything that
        isn't backed by a document.
      </p>
      <button
        onClick={onDismiss}
        className="mt-5 w-full rounded-lg bg-water/20 px-4 py-2.5 text-sm font-semibold text-water shadow-[inset_0_0_0_1px_rgba(34,211,238,.45)] transition hover:bg-water/30"
      >
        Trace the chain →
      </button>
    </div>
  );
}
