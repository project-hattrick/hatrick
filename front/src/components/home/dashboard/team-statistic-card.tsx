import { GlassPanel } from '@/components/common/glass-panel';
import { DualStat } from './dual-stat';
import { teamStatistic } from '@/config/match-dashboard.config';

/** Full stat comparison between the two teams. */
export function TeamStatisticCard() {
  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">Team Statistic</span>
        <span className="flex items-center gap-2 text-micro font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-neon" />{teamStatistic.home}</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-warning" />{teamStatistic.away}</span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {teamStatistic.lines.map((line) => (
          <DualStat key={line.label} {...line} />
        ))}
      </div>
    </GlassPanel>
  );
}
