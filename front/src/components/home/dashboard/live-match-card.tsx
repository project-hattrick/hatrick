import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { DualStat } from './dual-stat';
import { liveMatch } from '@/config/match-dashboard.config';

/** Compact live-match panel — score line plus a few key stats. */
export function LiveMatchCard() {
  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold">Live Match</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-live">
          <span className="size-1.5 animate-pulse rounded-full bg-live" />
          {liveMatch.minute}&apos;
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl bg-overlay/30 px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <Flag code={liveMatch.home.code} className="text-base" />
          {liveMatch.home.short}
        </span>
        <span className="font-mono text-lg font-bold tabular-nums text-neon">
          {liveMatch.score.home} - {liveMatch.score.away}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-bold">
          {liveMatch.away.short}
          <Flag code={liveMatch.away.code} className="text-base" />
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {liveMatch.stats.map((stat) => (
          <DualStat key={stat.label} {...stat} />
        ))}
      </div>
    </GlassPanel>
  );
}
