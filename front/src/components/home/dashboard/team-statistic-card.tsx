'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { DualStat } from './dual-stat';
import { useDashboardMatch } from './use-dashboard-match';

/** Full stat comparison between the two teams of the selected match. */
export function TeamStatisticCard() {
  const match = useDashboardMatch();

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">Team Statistic</span>
        <span className="flex items-center gap-2 text-micro font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-neon" />{match.home.name}</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-warning" />{match.away.name}</span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {match.statLines.map((line) => (
          <DualStat key={line.label} {...line} />
        ))}
      </div>
    </GlassPanel>
  );
}
