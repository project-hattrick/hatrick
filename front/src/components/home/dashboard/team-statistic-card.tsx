'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { DualStat } from './dual-stat';
import { useDashboardMatch } from './use-dashboard-match';

/**
 * Stat comparison between the two teams of the selected match. `limit` trims to the top-N lines and
 * `title` relabels the card, so the same widget doubles as the compact "Match Summary" up top.
 */
export function TeamStatisticCard({ title = 'Team Statistic', limit }: { title?: string; limit?: number } = {}) {
  const match = useDashboardMatch();
  const lines = limit ? match.statLines.slice(0, limit) : match.statLines;

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="shrink-0 text-sm font-bold">{title}</span>
        <span className="flex min-w-0 items-center gap-2 text-micro font-semibold text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1"><span className="size-2 shrink-0 rounded-full bg-neon" /><span className="truncate">{match.home.name}</span></span>
          <span className="inline-flex min-w-0 items-center gap-1"><span className="size-2 shrink-0 rounded-full bg-warning" /><span className="truncate">{match.away.name}</span></span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {lines.map((line) => (
          <DualStat key={line.label} {...line} />
        ))}
      </div>
    </GlassPanel>
  );
}
