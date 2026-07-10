'use client';

import { useDisplayMatch, useDisplayEvents } from '@/store/match.store';
import { describeMatchEvent } from '@/config/match-action.config';
import { MatchPicker } from '@/components/home/match-picker';
import { Flag } from '@/components/common/flag';
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
  const match = useDisplayMatch();
  const events = useDisplayEvents();

  const recent = [...events]
    .reverse()
    .flatMap((event) => {
      const meta = describeMatchEvent(event);
      return meta ? [{ event, meta }] : [];
    })
    .slice(0, MAX_EVENTS);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      {/* Phase badge doubles as the match switcher (LIVE / FULL-TIME · ENDED + caret). */}
      <MatchPicker variant="hero" />

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
          {recent.map(({ event, meta }) => {
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
