'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { List, X } from '@/components/common/icons';
import { matchActionConfig, matchActionFallback } from '@/config/match-action.config';
import { MatchAction } from '@/enums/match-action.enum';
import { lookup } from '@/lib/lookup';
import { cn } from '@/lib/utils';
import type { MatchEventPayload } from '@/types/match';

/** Low-signal rows (possession flow) render dimmed so goals/cards/corners pop. */
const QUIET_ACTIONS = new Set<MatchAction>([MatchAction.Possession, MatchAction.Unknown]);

interface EventBacklogProps {
  /** Feed events, newest first (use-match-feed ordering). */
  events: MatchEventPayload[];
  home: string;
  away: string;
}

/**
 * Scrolling backlog of the feed events driving the arena — what happened, when, and for whom — so a
 * replayed match reads as a narrative instead of unexplained on-pitch action.
 */
export function EventBacklog({ events, home, away }: EventBacklogProps) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="absolute bottom-16 right-3" onClick={() => setOpen(true)}>
        <List className="size-4" /> Events
      </Button>
    );
  }

  return (
    <div className="absolute bottom-16 right-3 top-16 flex w-[300px] flex-col rounded-xl border border-white/10 bg-black/55 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="font-mono text-eyebrow text-white/70">Match events</span>
        <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white" aria-label="Collapse events">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {events.map((event) => {
          const meta = lookup(matchActionConfig, event.action, matchActionFallback);
          const quiet = QUIET_ACTIONS.has(event.action);
          const team = event.participant === 1 ? home : event.participant === 2 ? away : '';
          const raw = event.rawAction && event.rawAction.toLowerCase() !== meta.label.toLowerCase() ? event.rawAction : null;
          return (
            <div
              key={`${event.seq}-${event.state}`}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
                quiet ? 'opacity-45' : 'bg-white/5',
              )}
            >
              <span className="w-7 shrink-0 text-right font-mono text-white/60">
                {event.minute != null ? `${event.minute}'` : '—'}
              </span>
              <span className={cn('size-1.5 shrink-0 rounded-full', meta.dotClass)} />
              <span className="min-w-0 flex-1 truncate font-semibold text-white/90">
                {meta.label}
                {raw ? <span className="ml-1 font-normal text-white/45">· {raw}</span> : null}
              </span>
              {team ? <span className="shrink-0 font-mono text-[10px] uppercase text-white/55">{team.slice(0, 3)}</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
