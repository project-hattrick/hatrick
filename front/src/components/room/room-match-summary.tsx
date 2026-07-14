'use client';

import { ClockCounterClockwise } from '@/components/common/icons';
import { MatchAction } from '@/enums/match-action.enum';
import { describeMatchEvent } from '@/config/match-action.config';
import { toMatchEvents } from '@/lib/fixture-actions';
import { formatMinute, formatScore } from '@/lib/format';
import { teamPlayerLabel } from '@/lib/player-identity';
import { cn } from '@/lib/utils';
import { useFixtureTimeline } from '@/services/queries/use-replay';
import { useDisplayMatch } from '@/store/match.store';
import { useReplaySessionStore } from '@/store/replay-session.store';
import type { FixtureAction, TimelineEvent } from '@/services/replay.service';

/** The wire emits each moment twice (during + after) — keep one per (minute, action, side, scoreline). */
function dedupeTimeline(events: TimelineEvent[]): TimelineEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.minute}|${event.action}|${event.participant}|${event.home}|${event.away}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Whole-match rundown for a replayed fixture: every notable moment (goals, cards,
 * corners…) with minute + team, shown upfront regardless of the playback position.
 * Prefers the full timeline endpoint (goals carry the running scoreline); the score
 * snapshot's notable actions are the fallback while it loads.
 */
export function RoomMatchSummary({ fixtureId, actions }: { fixtureId: number; actions: FixtureAction[] }) {
  const match = useDisplayMatch();
  const source = useReplaySessionStore((s) => s.source);
  const timeline = useFixtureTimeline(
    source && source.fixtureId === fixtureId
      ? { fixtureId, epochDay: source.epochDay, startHour: source.startHour }
      : null,
  );

  // Normalize both sources into aligned action + scoreline lists (snapshot actions carry no score).
  const entries = timeline.data
    ? dedupeTimeline(timeline.data.events).map((event) => ({
        action: { action: event.action, minute: event.minute, participant: event.participant },
        score: formatScore(event.home, event.away),
        player: event.player as string | undefined,
        shirt: event.shirt as number | undefined,
      }))
    : actions.map((action) => ({ action, score: null, player: undefined, shirt: undefined }));

  const moments = toMatchEvents(fixtureId, entries.map((entry) => entry.action))
    .map((event, index) => ({
      event,
      meta: describeMatchEvent(event),
      score: entries[index].score,
      player: entries[index].player,
      shirt: entries[index].shirt,
    }))
    .filter((moment) => moment.meta !== null)
    .sort((a, b) => (a.event.minute ?? 0) - (b.event.minute ?? 0));
  if (moments.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-foreground uppercase">
        <ClockCounterClockwise className="size-4 text-neon" />
        Full match
      </div>
      <ul className="flex flex-col gap-1.5">
        {moments.map(({ event, meta, score, player, shirt }, index) => {
          const isGoal = event.action === MatchAction.Goal;
          const teamCode = event.participant === 2 ? match.away.code : match.home.code;
          // Name the scorer: real name from the feed, else the `${CODE}-${shirt}` licensing-safe label.
          const scorer = isGoal ? (player ?? (shirt != null ? teamPlayerLabel(teamCode, shirt) : null)) : null;
          return (
            <li
              key={index}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                isGoal ? 'border-neon/40 bg-neon/[0.08]' : 'border-border/50 bg-surface-2/50',
              )}
            >
              <span className={cn('size-1.5 shrink-0 rounded-full', meta?.dotClass)} />
              <span className="w-8 shrink-0 font-mono font-bold tabular-nums text-muted-foreground">
                {event.minute != null ? formatMinute(event.minute) : '–'}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                {meta?.label}
                {scorer ? <span className="font-normal text-muted-foreground"> · {scorer}</span> : null}
              </span>
              {isGoal && score && (
                <span className="shrink-0 font-mono font-bold tabular-nums text-neon">{score}</span>
              )}
              {(event.participant === 1 || event.participant === 2) && (
                <span className="shrink-0 font-mono text-micro font-bold text-muted-foreground">{teamCode}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
