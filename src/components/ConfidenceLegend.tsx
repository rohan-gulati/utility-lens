import { CONFIDENCE_META, CONFIDENCE_ORDER } from '@/data/schema';

export default function ConfidenceLegend({
  evidenceMode,
  onToggle,
}: {
  evidenceMode: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="panel rounded-xl p-3">
      <button
        onClick={onToggle}
        className={`mb-2.5 w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold transition ${
          evidenceMode
            ? 'bg-water/20 text-water shadow-[inset_0_0_0_1px_rgba(34,211,238,.45)]'
            : 'bg-white/5 text-slate-300 hover:bg-white/10'
        }`}
      >
        {evidenceMode ? '● Showing only the evidence' : '○ How do we know this?'}
      </button>

      <div className="space-y-1.5">
        {CONFIDENCE_ORDER.slice().reverse().map((c) => {
          const meta = CONFIDENCE_META[c];
          const dimmed = evidenceMode && c === 'inferred';
          return (
            <div key={c} className={`flex gap-2 ${dimmed ? 'opacity-35' : ''}`}>
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ background: meta.color }}
              />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold" style={{ color: meta.color }}>
                  {meta.label}
                </div>
                <div className="text-[10px] leading-snug text-slate-500">{meta.blurb}</div>
              </div>
            </div>
          );
        })}
      </div>

      {evidenceMode && (
        <p className="mt-2.5 border-t border-white/8 pt-2 text-[10px] leading-snug text-slate-500">
          What's left is everything a retrieved document actually supports. The gaps are
          where the chain is reasoning, not evidence.
        </p>
      )}
    </div>
  );
}
