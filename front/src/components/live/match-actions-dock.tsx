'use client';

import { Flag } from '@/components/common/flag';
import { useDisplayMatch, useDisplayEvents } from '@/store/match.store';
import { matchActionConfig, matchActionFallback } from '@/config/match-action.config';
import { MatchAction } from '@/enums/match-action.enum';
import { lookup } from '@/lib/lookup';
import { fifaToIso } from '@/lib/country';
import { formatMinute } from '@/lib/format';
import { cn } from '@/lib/utils';

// Possession / unknown frames aren't "things that happened" — keep the recap to real actions.
const HIDDEN = new Set<MatchAction>([MatchAction.Possession, MatchAction.Unknown]);

/**
 * Full-time recap that replaces the live bet dock in the hero centre: you can't bet on a finished
 * match, so we show what actually happened (goals/cards/corners from the API) with real SVG flags.
 */
export function MatchActionsDock() {
  const match = useDisplayMatch();
  const events = useDisplayEvents();
  const actions = events
    .filter((event) => !HIDDEN.has(event.action))
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  return (
    <div className="w-full max-w-[460px] rounded-[26px] bg-muted p-1.5 shadow-[0px_0px_0px_1px_rgba(255,255,255,0.05),0px_16px_40px_-12px_rgba(0,0,0,0.55)] md:w-[min(460px,44vw)]">
      <div className="rounded-[20px] bg-surface-1/90 p-3 ring-1 ring-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-micro font-bold tracking-[0.16em] text-muted-foreground">
            FULL-TIME · RECAP
          </span>
          <span className="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums">
            <Flag code={fifaToIso(match.home.code)} className="text-base" />
            {match.score.home}
            <span className="text-muted-foreground">–</span>
            {match.score.away}
            <Flag code={fifaToIso(match.away.code)} className="text-base" />
          </span>
        </div>

        {actions.length ? (
          <ul className="mt-2.5 flex max-h-[168px] flex-col gap-1.5 overflow-y-auto pr-0.5">
            {actions.map((event) => {
              const meta = lookup(matchActionConfig, event.action, matchActionFallback);
              const team = event.participant === 2 ? match.away : match.home;
              return (
                <li key={event.seq} className="flex items-center gap-2 rounded-lg bg-foreground/[0.03] px-2.5 py-1.5">
                  <span className="w-8 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatMinute(event.minute ?? match.minute)}
                  </span>
                  <span className={cn('size-1.5 shrink-0 rounded-full', meta.dotClass)} />
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span className="ml-auto flex items-center gap-1.5">
                    {event.label ? <span className="truncate text-xs text-muted-foreground">{event.label}</span> : null}
                    <Flag code={fifaToIso(team.code)} className="text-sm" />
                    <span className="font-mono text-xs font-bold">{team.code}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-center text-xs text-muted-foreground">No key events on record for this match.</p>
        )}
      </div>
    </div>
  );
}
