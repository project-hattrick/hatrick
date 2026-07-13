'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { MatchAction } from '@/enums/match-action.enum';
import { formatMinute } from '@/lib/format';
import { teamPlayerLabel } from '@/lib/player-identity';
import { useDisplayEvents, useMatchLineups } from '@/store/match.store';
import { useDashboardMatch } from './use-dashboard-match';

/**
 * "Key Events" — the match's real narrative from the event stream: goals and cards with their minute,
 * team and (when the feed sent line-ups) the real player involved. Prefers the TxLINE `preferredName`,
 * falling back to the `${CODE}-${shirt}` label. Everything here is real feed data. Falls back to the
 * recap goals while the feed is dormant.
 */

const NOTABLE: Partial<Record<MatchAction, { label: string; dot: string }>> = {
  [MatchAction.Goal]: { label: 'Goal', dot: 'bg-neon' },
  [MatchAction.Penalty]: { label: 'Penalty', dot: 'bg-neon' },
  [MatchAction.YellowCard]: { label: 'Yellow Card', dot: 'bg-warning' },
  [MatchAction.RedCard]: { label: 'Red Card', dot: 'bg-live' },
  [MatchAction.Substitution]: { label: 'Substitution', dot: 'bg-muted-foreground' },
  [MatchAction.Var]: { label: 'VAR', dot: 'bg-muted-foreground' },
  [MatchAction.Corner]: { label: 'Corner', dot: 'bg-team-home' },
};

const MAX_ROWS = 6;

export function KeyEventsCard() {
  const match = useDashboardMatch();
  const events = useDisplayEvents();
  const lineups = useMatchLineups();

  // playerId → { real name, shirt } so a scorer/carded player reads as their real name (feed data),
  // falling back to CODE-shirt when the feed carries no name.
  const infoById = new Map<number, { name?: string; shirt?: number }>();
  [lineups?.home, lineups?.away].forEach((side) =>
    side?.forEach((slot) => {
      infoById.set(slot.playerId, { name: slot.name?.trim() || undefined, shirt: slot.shirt });
    }),
  );

  const rows = events.filter((event) => event.minute != null && NOTABLE[event.action] != null).slice(-MAX_ROWS);

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">Key Events</span>
        <span className="font-mono text-micro font-semibold text-muted-foreground uppercase">Live feed</span>
      </div>

      {rows.length ? (
        <div className="flex flex-col">
          {rows.map((event, i) => {
            const meta = NOTABLE[event.action];
            if (!meta) return null;
            const home = event.participant !== 2;
            const team = home ? match.home : match.away;
            const info = event.playerId != null ? infoById.get(event.playerId) : undefined;
            const who = info?.name ?? (info?.shirt != null ? teamPlayerLabel(team.code, info.shirt) : null);
            return (
              <div
                key={`${event.seq}-${i}`}
                className={`flex items-center gap-2.5 py-2 text-xs ${i ? 'border-t border-border' : ''}`}
              >
                <span className="w-9 shrink-0 font-mono font-bold tabular-nums text-muted-foreground">
                  {formatMinute(event.minute ?? 0)}
                </span>
                <span className={`size-2 shrink-0 rounded-full ${meta.dot}`} />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {meta.label}
                  {who ? <span className="text-muted-foreground"> · {who}</span> : null}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-mono font-semibold text-muted-foreground">
                  <Flag code={team.iso} className="text-sm" />
                  {team.code}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">
          No key events yet — goals and cards land here as the match unfolds.
        </span>
      )}
    </GlassPanel>
  );
}
