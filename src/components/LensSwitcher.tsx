import type { Utility } from '@/data/schema';

const LENSES: { id: Utility; label: string; icon: string; ready: boolean }[] = [
  { id: 'water', label: 'Water', icon: '💧', ready: true },
  { id: 'sewage', label: 'Sewage', icon: '🚽', ready: false },
  { id: 'power', label: 'Power', icon: '⚡', ready: false },
  { id: 'roads', label: 'Roads', icon: '🛣️', ready: false },
];

export default function LensSwitcher({ active }: { active: Utility }) {
  return (
    <div className="panel flex gap-1 rounded-xl p-1">
      {LENSES.map((l) => {
        const isActive = l.id === active;
        return (
          <button
            key={l.id}
            disabled={!l.ready}
            title={l.ready ? undefined : 'Not built yet — the data model already carries it'}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition ${
              isActive
                ? 'bg-water/20 text-water shadow-[inset_0_0_0_1px_rgba(34,211,238,.45)]'
                : l.ready
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'cursor-not-allowed text-slate-600'
            }`}
          >
            <span className={l.ready ? '' : 'grayscale opacity-50'}>{l.icon}</span>
            {l.label}
            {!l.ready && <span className="text-[9px] font-normal text-slate-600">soon</span>}
          </button>
        );
      })}
    </div>
  );
}
