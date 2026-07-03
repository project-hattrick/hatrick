import { GlassPanel } from '@/components/common/glass-panel';
import { lineup } from '@/config/match-dashboard.config';

/** "Team Line Up" — position badge with each side's player. */
export function TeamLineupCard() {
  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <span className="text-[13px] font-bold">Team Line Up</span>

      <div className="flex flex-col">
        {lineup.map((row, i) => (
          <div
            key={`${row.pos}-${row.home}`}
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5 text-[11px] ${
              i > 0 ? 'border-t border-white/5' : ''
            }`}
          >
            <span className="truncate font-medium text-foreground">{row.home}</span>
            <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
              {row.pos}
            </span>
            <span className="truncate text-right font-medium text-foreground">{row.away}</span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
