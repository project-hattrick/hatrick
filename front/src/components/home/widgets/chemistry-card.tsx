import { GlassPanel } from '@/components/common/glass-panel';
import { Lightning } from '@/components/common/icons';
import { chemistry } from '@/config/formation.config';

const SEGMENTS = 10;

/** "Chemistry" — qualitative rating, the reason, and a segmented fill meter. */
export function ChemistryCard() {
  const filled = Math.round((chemistry.value / 100) * SEGMENTS);

  return (
    <GlassPanel tone="dark" radius="xl" className="flex flex-col gap-3 p-5">
      <div className="text-eyebrow flex items-center gap-1.5 text-muted-foreground">
        <Lightning weight="fill" className="size-3.5 text-neon" />
        Chemistry
      </div>

      <p className="text-sm">
        <span className="font-bold text-foreground">{chemistry.rating}</span>
        <span className="text-muted-foreground"> · {chemistry.note}</span>
      </p>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < filled ? 'bg-neon' : 'bg-foreground/10'}`}
            />
          ))}
        </div>
        <span className="font-mono text-sm font-bold text-foreground tabular-nums">{chemistry.value}%</span>
      </div>
    </GlassPanel>
  );
}
