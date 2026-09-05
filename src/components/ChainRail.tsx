import type { Asset, Chain, Link } from '@/data/schema';
import { CONFIDENCE_META, KIND_META } from '@/data/schema';
import { assetById, linkBetween, pathLengthKm } from '@/data/loader';

const KIND_ICON: Record<string, string> = {
  catchment: '🏔️',
  conveyance: '〰️',
  treatment: '🏭',
  reservoir: '🛢️',
  pumping: '⚙️',
  distribution: '🔀',
  service: '🔩',
  storage: '🏠',
  fallback: '🚚',
};

export default function ChainRail({
  chain,
  selectedId,
  onSelect,
}: {
  chain: Chain;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const hops = chain.hopIds.map((id) => assetById.get(id)).filter(Boolean) as Asset[];

  return (
    <div className="scroll-thin overflow-x-auto pb-1">
      <div className="flex min-w-max items-stretch gap-0 px-1">
        {hops.map((asset, i) => {
          const next = hops[i + 1];
          const link: Link | undefined = next ? linkBetween(asset.id, next.id) : undefined;
          const meta = CONFIDENCE_META[asset.confidence];
          const isSelected = asset.id === selectedId;

          return (
            <div key={asset.id} className="flex items-stretch">
              <button
                onClick={() => onSelect(asset.id)}
                className={`panel w-[172px] rounded-xl p-3 text-left transition hover:border-water/40 ${
                  isSelected ? 'ring-1 ring-water/60' : ''
                }`}
                style={isSelected ? { borderColor: `${meta.color}88` } : undefined}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-base leading-none">{KIND_ICON[asset.kind]}</span>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: meta.color }}
                    title={meta.label}
                  />
                </div>
                <div className="mb-0.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
                  {String(i + 1).padStart(2, '0')} · {KIND_META[asset.kind].label}
                </div>
                <div className="text-[13px] font-semibold leading-tight text-slate-100">
                  {asset.name}
                </div>
              </button>

              {link && (
                <div className="flex w-[74px] flex-col items-center justify-center px-1">
                  <div
                    className="h-px w-full"
                    style={{
                      background:
                        link.confidence === 'inferred'
                          ? `repeating-linear-gradient(90deg, ${CONFIDENCE_META.inferred.color}aa 0 5px, transparent 5px 10px)`
                          : CONFIDENCE_META[link.confidence].color,
                    }}
                  />
                  <div className="mt-1 whitespace-nowrap font-mono text-[9px] text-slate-500">
                    {pathLengthKm(link.path) < 1
                      ? `${Math.round(pathLengthKm(link.path) * 1000)} m`
                      : `${pathLengthKm(link.path).toFixed(0)} km`}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
