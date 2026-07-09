'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { DualStat } from './dual-stat';
import { useDashboardMatch } from './use-dashboard-match';

/** Compact live-match panel — score line plus a few key stats, bound to the selected match. */
export function LiveMatchCard() {
  const match = useDashboardMatch();

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">Live Match</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-micro font-bold text-live">
          <span className="size-1.5 animate-pulse rounded-full bg-live" />
          {match.minute}&apos;
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl bg-overlay/30 px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <Flag code={match.home.iso} className="text-base" />
          {match.home.code}
        </span>
        <span className="font-mono text-lg font-bold tabular-nums text-neon">
          {match.score.home} - {match.score.away}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-bold">
          {match.away.code}
          <Flag code={match.away.iso} className="text-base" />
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {match.liveStats.map((stat) => (
          <DualStat key={stat.label} {...stat} />
        ))}
      </div>
    </GlassPanel>
  );
}
