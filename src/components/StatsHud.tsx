import type { Chain } from '@/data/schema';
import { assetById, chainLinks, haversineKm, pathLengthKm } from '@/data/loader';

function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="px-3.5 py-2">
      <div className="font-mono text-lg font-medium leading-none text-water">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      {sub && <div className="mt-0.5 text-[9px] text-slate-600">{sub}</div>}
    </div>
  );
}

export default function StatsHud({ chain }: { chain: Chain }) {
  const links = chainLinks(chain);
  const drawn = links.reduce((sum, l) => sum + pathLengthKm(l.path), 0);
  const first = assetById.get(chain.hopIds[0]);
  const straight = first ? haversineKm(first.position, chain.pin) : 0;

  const hops = chain.hopIds.map((id) => assetById.get(id)!).filter(Boolean);
  const documented = hops.filter((a) => a.confidence === 'documented').length;
  const surveyed = hops.filter((a) => a.confidence === 'surveyed').length;

  return (
    <div className="panel flex divide-x divide-white/8 rounded-xl">
      <Stat value={`${Math.round(straight)} km`} label="From source" sub="straight line" />
      <Stat value={`${Math.round(drawn)} km`} label="Along the chain" sub="drawn route" />
      <Stat value={`${hops.length}`} label="Hops" sub="source → tap" />
      <Stat
        value={`${documented + surveyed}/${hops.length}`}
        label="Evidenced"
        sub={surveyed ? `${surveyed} surveyed` : 'none surveyed yet'}
      />
    </div>
  );
}
