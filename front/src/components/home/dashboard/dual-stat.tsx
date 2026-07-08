import type { StatLine } from '@/config/match-dashboard.config';

/** Mirrored stat row — home value / label / away value over a centre-anchored split bar. */
export function DualStat({ label, home, away }: StatLine) {
  const total = home + away || 1;
  const homeShare = (home / total) * 100;
  const awayShare = (away / total) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="w-8 text-left font-bold tabular-nums text-foreground">{home}</span>
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="w-8 text-right font-bold tabular-nums text-foreground">{away}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex flex-1 justify-end">
          <div className="h-1.5 rounded-full bg-neon" style={{ width: `${homeShare}%` }} />
        </div>
        <div className="flex flex-1 justify-start">
          <div className="h-1.5 rounded-full bg-warning" style={{ width: `${awayShare}%` }} />
        </div>
      </div>
    </div>
  );
}
