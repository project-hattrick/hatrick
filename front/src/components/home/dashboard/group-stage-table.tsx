'use client';

import { Fragment, useState } from 'react';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { groupStage, type MatchResult } from '@/config/match-dashboard.config';
import { cn } from '@/lib/utils';

const GRID =
  'grid grid-cols-[1.75rem_minmax(6rem,1fr)_2rem_2rem_2rem_2rem_2.25rem_4.5rem_2.5rem] items-center gap-2';

const formClass: Record<MatchResult, string> = {
  W: 'bg-neon text-primary-foreground',
  D: 'bg-foreground/25 text-foreground',
  L: 'bg-live text-white',
};

function Form({ form }: { form: MatchResult[] }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {form.map((r, i) => (
        <span key={i} className={cn('grid size-4 place-items-center rounded-full text-micro font-bold', formClass[r])}>
          {r}
        </span>
      ))}
    </div>
  );
}

/** World Cup group-stage standings with a group selector; the top two advance (cut line). */
export function GroupStageTable() {
  const [active, setActive] = useState(groupStage[0].key);
  const group = groupStage.find((g) => g.key === active) ?? groupStage[0];

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 text-base font-bold">🌍 Group stage</span>
          <span className="text-xs text-muted-foreground">Top two advance to the knockouts</span>
        </div>
        <div className="flex gap-1.5">
          {groupStage.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setActive(g.key)}
              aria-pressed={g.key === active}
              className={cn(
                'grid size-9 cursor-pointer place-items-center rounded-lg text-sm font-bold transition',
                g.key === active
                  ? 'bg-neon text-primary-foreground'
                  : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10',
              )}
            >
              {g.key}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className={cn(GRID, 'text-eyebrow px-3 pb-1 text-muted-foreground')}>
            <span className="text-center">#</span>
            <span>Team</span>
            <span className="text-center">P</span>
            <span className="text-center">W</span>
            <span className="text-center">D</span>
            <span className="text-center">L</span>
            <span className="text-center">GD</span>
            <span className="text-right">Form</span>
            <span className="text-center">Pts</span>
          </div>

          <div className="flex flex-col">
            {group.teams.map((team, i) => {
              const gd = team.gf - team.ga;
              const advances = i < 2;
              return (
                <Fragment key={team.code}>
                  {i === 2 ? <div className="my-1 border-t border-dashed border-neon/30" /> : null}
                  <div
                    className={cn(
                      GRID,
                      'rounded-lg px-3 py-2.5 text-caption transition hover:bg-foreground/5',
                      advances && 'bg-neon/[0.06]',
                    )}
                  >
                    <span
                      className={cn(
                        'mx-auto grid size-6 place-items-center rounded-full text-caption font-bold tabular-nums',
                        advances ? 'bg-neon text-primary-foreground' : 'bg-foreground/8 text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 items-center gap-2.5 font-semibold">
                      <Flag code={team.code} className="text-lg" />
                      <span className="truncate">{team.name}</span>
                    </span>
                    <span className="text-center tabular-nums text-muted-foreground">{team.p}</span>
                    <span className="text-center tabular-nums">{team.w}</span>
                    <span className="text-center tabular-nums">{team.d}</span>
                    <span className="text-center tabular-nums">{team.l}</span>
                    <span className="text-center tabular-nums text-muted-foreground">{gd > 0 ? `+${gd}` : gd}</span>
                    <Form form={team.form} />
                    <span className="grid place-items-center">
                      <span className="grid h-7 min-w-7 place-items-center rounded-md bg-neon/15 px-1.5 text-sm font-bold tabular-nums text-neon">
                        {team.pts}
                      </span>
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
