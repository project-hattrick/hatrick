'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { formationFor, lineupFor, realLineupFor } from '@/config/team-lineups.config';
import { useMatchLineups } from '@/store/match.store';
import { FormationField } from './formation-field';
import { useDashboardMatch } from './use-dashboard-match';

function TeamTag({ name, shape, code, align }: { name: string; shape: string; code: string; align?: 'right' }) {
  return (
    <div className={align === 'right' ? 'flex flex-row-reverse items-center gap-1.5 text-right' : 'flex items-center gap-1.5'}>
      <Flag code={code} className="text-sm" />
      <div className={align === 'right' ? 'flex flex-col items-end' : 'flex flex-col'}>
        <span className="text-micro font-bold">{name}</span>
        <span className="font-mono text-micro text-muted-foreground">{shape}</span>
      </div>
    </div>
  );
}

/**
 * "Team Line Up" — the merged formation + XI card: a draggable 3D pitch showing both sides' tactical
 * shape, then each side's starting XI for the SELECTED match (position badge down the middle). Real
 * feed lineups (`action=lineups`) win; the 1–11 template stands in.
 */
export function TeamLineupCard() {
  const match = useDashboardMatch();
  const lineups = useMatchLineups();
  const home = lineups?.home.length ? realLineupFor(match.home.code, lineups.home) : lineupFor(match.home.code);
  const away = lineups?.away.length ? realLineupFor(match.away.code, lineups.away) : lineupFor(match.away.code);
  const isReal = Boolean(lineups && (lineups.home.length || lineups.away.length));

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-1 flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold">Team Line Up</span>
        {isReal ? (
          <span className="rounded bg-neon/15 px-1.5 py-0.5 font-mono text-micro font-bold tracking-wider text-neon">
            LIVE XI
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <TeamTag name={match.home.name} shape={formationFor(match.home.code)} code={match.home.iso} />
        <TeamTag name={match.away.name} shape={formationFor(match.away.code)} code={match.away.iso} align="right" />
      </div>

      <FormationField />

      <div className="flex flex-col">
        {home.map((row, i) => (
          <div
            key={`${row.pos}-${i}`}
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 text-xs ${
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
