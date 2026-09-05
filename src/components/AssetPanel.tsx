import type { Asset, Link } from '@/data/schema';
import { CONFIDENCE_META, KIND_META } from '@/data/schema';
import { sourceById } from '@/data/loader';
import ConfidenceChip from './ConfidenceChip';

function SourceList({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <ul className="space-y-1.5">
      {ids.map((id) => {
        const s = sourceById.get(id);
        if (!s) return null;
        const href = s.archived ?? s.url;
        const isLink = href?.startsWith('http');
        return (
          <li key={id} className="text-[11px] leading-snug text-slate-400">
            <span className="text-slate-500">▸ </span>
            {isLink ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-water/85 underline decoration-water/30 underline-offset-2 hover:text-water"
              >
                {s.title}
              </a>
            ) : (
              <span className="text-slate-300">{s.title}</span>
            )}
            <span className="text-slate-600"> — {s.publisher}</span>
            {s.published && <span className="text-slate-600">, {s.published}</span>}
            {s.archived?.startsWith('http') && (
              <span className="ml-1 font-mono text-[9px] text-slate-600">[archived]</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function AssetPanel({
  asset,
  inboundLink,
  onClose,
}: {
  asset: Asset;
  inboundLink?: Link;
  onClose: () => void;
}) {
  return (
    <aside className="panel scroll-thin absolute right-4 top-4 z-20 flex max-h-[calc(100vh-2rem)] w-[370px] flex-col overflow-y-auto rounded-2xl">
      <div className="sticky top-0 z-10 border-b border-white/5 bg-ink-800/95 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
              {KIND_META[asset.kind].label}
            </div>
            <h2 className="mt-1 text-lg font-bold leading-tight text-slate-50">{asset.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <ConfidenceChip confidence={asset.confidence} />
          {asset.operator && (
            <span className="text-[10px] text-slate-500">{asset.operator}</span>
          )}
        </div>
      </div>

      <div className="space-y-5 px-5 pb-5 pt-4">
        <p className="text-[13px] leading-relaxed text-slate-300">{asset.narrative}</p>

        {asset.candidates && (
          <section>
            <h3 className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-inferred">
              Unresolved — {asset.candidates.length} candidates
            </h3>
            <div className="space-y-2">
              {asset.candidates.map((c) => (
                <div
                  key={c.name}
                  className="rounded-lg border border-inferred/25 bg-inferred/5 p-2.5"
                >
                  <div className="text-[12px] font-semibold text-slate-200">{c.name}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{c.note}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!!asset.facts?.length && (
          <section>
            <h3 className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
              What we know
            </h3>
            <div className="space-y-2.5">
              {asset.facts.map((f) => (
                <div key={f.label} className="border-l border-white/10 pl-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-slate-500">{f.label}</span>
                    <ConfidenceChip confidence={f.confidence} size="xs" />
                  </div>
                  <div className="mt-0.5 text-[13px] font-medium text-slate-200">{f.value}</div>
                  {f.note && (
                    <div className="mt-1 text-[11px] italic leading-snug text-slate-500">
                      {f.note}
                    </div>
                  )}
                  {!!f.sourceIds?.length && (
                    <div className="mt-1.5">
                      <SourceList ids={f.sourceIds} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {inboundLink?.routeNote && (
          <section className="rounded-lg border border-white/8 bg-black/25 p-3">
            <h3 className="mb-1.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
              The line into this hop
              <ConfidenceChip confidence={inboundLink.confidence} size="xs" />
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-400">{inboundLink.routeNote}</p>
            {inboundLink.lengthNote && (
              <p className="mt-1 font-mono text-[10px] text-slate-600">{inboundLink.lengthNote}</p>
            )}
          </section>
        )}

        {asset.pendingNote && (
          <section className="rounded-lg border border-inferred/25 bg-inferred/5 p-3">
            <h3 className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-inferred">
              What would settle this
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-300">{asset.pendingNote}</p>
          </section>
        )}

        {!!asset.sourceIds?.length && (
          <section>
            <h3 className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
              Sources
            </h3>
            <SourceList ids={asset.sourceIds} />
          </section>
        )}

        <p className="border-t border-white/5 pt-3 text-[10px] leading-snug text-slate-600">
          {CONFIDENCE_META[asset.confidence].blurb}
        </p>
      </div>
    </aside>
  );
}
