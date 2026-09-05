import { SCOPES, type Scope } from '@/map/layers';

export default function ScopeControl({
  scope,
  onChange,
}: {
  scope: Scope;
  onChange: (s: Scope) => void;
}) {
  return (
    <div className="panel flex items-center gap-1 rounded-xl p-1">
      <div className="px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
        Scale
      </div>
      {SCOPES.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
            s.id === scope
              ? 'bg-water/20 text-water shadow-[inset_0_0_0_1px_rgba(34,211,238,.45)]'
              : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
