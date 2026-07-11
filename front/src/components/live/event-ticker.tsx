'use client';

import { Fragment } from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import { useMatch, useMatchEvents } from '@/store/match.store';
import { describeMatchEvent } from '@/config/match-action.config';
import { formatMinute } from '@/lib/format';
import { cn } from '@/lib/utils';

const MAX = 3;

/** Compact timeline of the most recent noteworthy match events (noise like safe possession is hidden). */
export function EventTicker() {
  const match = useMatch();
  const events = useMatchEvents();
  if (!match) return null;

  const recent = [...events]
    .reverse()
    .flatMap((event) => {
      const meta = describeMatchEvent(event);
      return meta ? [{ event, meta }] : [];
    })
    .slice(0, MAX);
  if (recent.length === 0) return null;

  return (
    <GlassPanel radius="pill" className="hidden items-center gap-4 px-5 py-1.5 text-xs text-muted-foreground md:flex">
      {recent.map(({ event, meta }, index) => {
        const teamCode = event.participant === 1 ? match.home.code : match.away.code;
        return (
          <Fragment key={event.seq}>
            {index > 0 ? <span className="h-3 w-px bg-border" /> : null}
            <span className="flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass)} />
              {formatMinute(event.minute ?? match.minute)} {meta.label}
              {event.label
                ? ` · ${event.label}${event.label.startsWith(teamCode) ? '' : ` (${teamCode})`}`
                : null}
            </span>
          </Fragment>
        );
      })}
    </GlassPanel>
  );
}
