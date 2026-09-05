import { CONFIDENCE_META, type Confidence } from '@/data/schema';

export default function ConfidenceChip({
  confidence,
  size = 'sm',
}: {
  confidence: Confidence;
  size?: 'sm' | 'xs';
}) {
  const meta = CONFIDENCE_META[confidence];
  return (
    <span
      title={meta.blurb}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide ${
        size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
      style={{
        color: meta.color,
        borderColor: `${meta.color}55`,
        background: `${meta.color}12`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: meta.color }}
        aria-hidden
      />
      {meta.label.toUpperCase()}
    </span>
  );
}
