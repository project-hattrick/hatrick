'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { lineupFor } from '@/config/team-lineups.config';
import { useDashboardMatch } from './use-dashboard-match';

/** "Team Line Up" — each side's XI for the SELECTED match (position badge down the middle). */
export function TeamLineupCard() {
  const match = useDashboardMatch();
  const home = lineupFor(match.home.code);
  const away = lineupFor(match.away.code);

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-1 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">Team Line Up</span>
        <span className="flex items-center gap-2 text-micro font-mono text-muted-foreground">
          <Flag code={match.home.iso} className="text-sm" /> {match.home.code}
          <span className="opacity-50">·</span>
          {match.away.code} <Flag code={match.away.iso} className="text-sm" />
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between">
        {home.map((row, i) => (
          <div
            key={`${row.pos}-${i}`}
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5 text-xs ${
              i > 0 ? 'border-t border-border' : ''
            }`}
          >
            <span className="truncate font-medium text-foreground">{row.name}</span>
            <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-micro font-bold text-muted-foreground">
              {row.pos}
            </span>
            <span className="truncate text-right font-medium text-foreground">{away[i]?.name}</span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
