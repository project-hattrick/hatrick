'use client';

import { useMatch, useMatchEvents } from '@/store/match.store';
import { gameStateConfig, gameStateFallback } from '@/config/game-state.config';
import { matchActionConfig, matchActionFallback } from '@/config/match-action.config';
import { Flag } from '@/components/common/flag';
import { lookup } from '@/lib/lookup';
import { fifaToIso } from '@/lib/country';
import { formatMinute } from '@/lib/format';
import { cn } from '@/lib/utils';

const MAX_EVENTS = 3;

function TeamColumn({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      <Flag code={fifaToIso(code)} className="text-lg sm:text-2xl" />
      <span className="text-micro font-semibold tracking-[0.1em] text-foreground/90 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)] sm:text-xs">
        {code}
      </span>
    </div>
  );
}

/** Minimal, backgroundless scoreline (wire 3a): LIVE badge · flags + score · event chips. */
export function Scoreboard() {
  const match = useMatch();
  const events = useMatchEvents();
  if (!match) return null;

  const phase = lookup(gameStateConfig, match.gameState, gameStateFallback);
  const recent = [...events].reverse().slice(0, MAX_EVENTS);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-live/30 bg-overlay/45 px-3 py-1 backdrop-blur-md">
        <span className="size-1.5 animate-pulse rounded-full bg-live" />
        <span className="font-mono text-eyebrow text-live">
          LIVE {formatMinute(match.minute)} · {phase.label}
        </span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <TeamColumn code={match.home.code} />
        <div className="flex items-center gap-2 text-[38px] font-bold leading-none [text-shadow:0_4px_24px_rgba(0,0,0,0.85)] sm:gap-2.5 sm:text-[52px]">
          <span>{match.score.home}</span>
          <span className="text-2xl text-muted-foreground sm:text-[34px]">–</span>
          <span>{match.score.away}</span>
        </div>
        <TeamColumn code={match.away.code} />
      </div>

      {recent.length > 0 ? (
        <div className="hidden flex-wrap justify-center gap-1.5 md:flex">
          {recent.map((event) => {
            const meta = lookup(matchActionConfig, event.action, matchActionFallback);
            const teamCode = event.participant === 1 ? match.home.code : match.away.code;
            return (
              <span
                key={event.seq}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-overlay/40 px-2 py-1 text-xs font-semibold text-foreground/80 backdrop-blur-md"
              >
                <span className={cn('size-1.5 rounded-full', meta.dotClass)} />
                {formatMinute(event.minute ?? match.minute)} {meta.label}
                {event.label ? ` · ${event.label} (${teamCode})` : null}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
