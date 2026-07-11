'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { type MatchResult } from '@/config/match-dashboard.config';
import { useDisplayMatch, useIsMatchLive, useIsReplay } from '@/store/match.store';
import { deriveLiveGroups } from './derive-group-stage';
import { cn } from '@/lib/utils';

// Compact 5-column layout on phones (#, Team, P, GD, Pts); the full 9-column table folds back in at sm+.
const GRID =
  'grid grid-cols-[1.75rem_minmax(4rem,1fr)_2rem_2.25rem_2.5rem] items-center gap-1.5 sm:grid-cols-[1.75rem_minmax(6rem,1fr)_2rem_2rem_2rem_2rem_2.25rem_4.5rem_2.5rem] sm:gap-2';

// Secondary standings columns (W/D/L/Form) hide on phones and return at sm+.
const HIDE_SM = 'hidden sm:block';

const formClass: Record<MatchResult, string> = {
  W: 'bg-neon text-primary-foreground',
  D: 'bg-foreground/25 text-foreground',
  L: 'bg-live text-white',
};

function Form({ form }: { form: MatchResult[] }) {
  return (
    <div className="hidden items-center justify-end gap-1 sm:flex">
      {form.map((r, i) => (
        <span key={i} className={cn('grid size-4 place-items-center rounded-full text-micro font-bold', formClass[r])}>
          {r}
        </span>
      ))}
    </div>
  );
}

/** World Cup group-stage standings that fold in the selected match live; the top two advance (cut line). */
export function GroupStageTable() {
  const match = useDisplayMatch();
  const isReplay = useIsReplay();
  const isLive = useIsMatchLive();
  const showLive = isReplay || isLive;

  const { groups, liveKey } = useMemo(
    () => deriveLiveGroups(match),
    [match.home.code, match.away.code, match.score.home, match.score.away],
  );

  // Follow the selected match's group by default; a manual pick sticks until the match's group changes.
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [liveKey]);
  const activeKey = picked ?? liveKey;
  const group = groups.find((g) => g.key === activeKey) ?? groups[0];

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 text-base font-bold">
            Group stage
            {showLive && group.key === liveKey ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-live/15 px-2 py-0.5 text-eyebrow font-bold text-live">
                <span className="size-1.5 animate-pulse rounded-full bg-live" /> LIVE
              </span>
            ) : null}
          </span>
          <span className="text-xs text-muted-foreground">
            {group.synthetic ? 'Live table for this match' : 'Top two advance to the knockouts'}
          </span>
        </div>
        <div className="flex gap-1.5">
          {groups.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setPicked(g.key)}
              aria-pressed={g.key === activeKey}
              className={cn(
                'relative grid size-9 cursor-pointer place-items-center rounded-lg text-sm font-bold transition',
                g.key === activeKey
                  ? 'bg-neon text-primary-foreground'
                  : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10',
              )}
            >
              {g.key}
              {g.key === liveKey && g.key !== activeKey ? (
                <span className="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-live ring-2 ring-background" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-0">
          <div className={cn(GRID, 'text-eyebrow px-3 pb-1 text-muted-foreground')}>
            <span className="text-center">#</span>
            <span>Team</span>
            <span className="text-center">P</span>
            <span className={cn('text-center', HIDE_SM)}>W</span>
            <span className={cn('text-center', HIDE_SM)}>D</span>
            <span className={cn('text-center', HIDE_SM)}>L</span>
            <span className="text-center">GD</span>
            <span className={cn('text-right', HIDE_SM)}>Form</span>
            <span className="text-center">Pts</span>
          </div>

          <div className="flex flex-col">
            {group.teams.map((team, i) => {
              const gd = team.gf - team.ga;
              const advances = i < 2;
              const isLiveRow = team.live && showLive;
              return (
                <Fragment key={team.code}>
                  {i === 2 ? <div className="my-1 border-t border-dashed border-neon/30" /> : null}
                  <div
                    className={cn(
                      GRID,
                      'rounded-lg px-3 py-2.5 text-caption transition hover:bg-foreground/5',
                      advances && 'bg-neon/[0.06]',
                      isLiveRow && 'bg-live/[0.08] ring-1 ring-inset ring-live/30',
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
                      {isLiveRow ? <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-live" /> : null}
                    </span>
                    <span className="text-center tabular-nums text-muted-foreground">{team.p}</span>
                    <span className={cn('text-center tabular-nums', HIDE_SM)}>{team.w}</span>
                    <span className={cn('text-center tabular-nums', HIDE_SM)}>{team.d}</span>
                    <span className={cn('text-center tabular-nums', HIDE_SM)}>{team.l}</span>
                    <span className="text-center tabular-nums text-muted-foreground">{gd > 0 ? `+${gd}` : gd}</span>
                    <Form form={team.form} />
                    <span className="grid place-items-center">
                      <span
                        className={cn(
                          'grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-sm font-bold tabular-nums',
                          isLiveRow ? 'bg-live/15 text-live' : 'bg-neon/15 text-neon',
                        )}
                      >
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
