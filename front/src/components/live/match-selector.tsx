'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { Broadcast, CircleNotch } from '@/components/common/icons';
import { Flag } from '@/components/common/flag';
import { fifaToIso } from '@/lib/country';
import { teamInfoFromName } from '@/config/teams.config';
import { TeamSide } from '@/enums/team-side.enum';
import { useUpcomingFixtures } from '@/services/queries/use-replay';
import { useLoadReplay } from '@/hooks/use-load-replay';
import { useDisplayMatch, useIsSwitching, useMatchStore } from '@/store/match.store';
import { fixtureToReplayItem, isFixtureLive, toMs } from '@/lib/fixture-replay';
import type { MatchScore } from '@/types/match';
import type { FixtureDto } from '@/services/txline.service';
import { cn } from '@/lib/utils';

// Keep the rail compact — a quick switch list, not the full picker.
const MAX_ROWS = 6;

function MatchRow({
  fixture,
  now,
  watching,
  loading,
  score,
  onSelect,
}: {
  fixture: FixtureDto;
  now: number;
  watching: boolean;
  loading: boolean;
  score: MatchScore | null;
  onSelect: () => void;
}) {
  const home = teamInfoFromName(fixture.Participant1, TeamSide.Home);
  const away = teamInfoFromName(fixture.Participant2, TeamSide.Away);
  const live = isFixtureLive(fixture, now);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={watching}
      className={cn(
        'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition',
        watching ? 'border-neon/40 bg-neon/5' : 'border-white/10 bg-foreground/[0.02] hover:bg-foreground/5',
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold">
        {live ? (
          <>
            <span className="size-1.5 animate-pulse rounded-full bg-live" />
            <span className="text-live">Live</span>
          </>
        ) : (
          <span className="text-muted-foreground">Soon</span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <Flag code={fifaToIso(home.code)} className="text-base" />
        <span className="truncate text-sm font-bold">{home.code}</span>
        {score ? (
          <span className="font-mono text-sm font-bold tabular-nums">
            {score.home}–{score.away}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">v</span>
        )}
        <span className="truncate text-sm font-bold">{away.code}</span>
        <Flag code={fifaToIso(away.code)} className="text-base" />
      </span>
      {loading ? (
        <CircleNotch className="size-3.5 shrink-0 animate-spin text-neon" />
      ) : watching ? (
        <span className="text-eyebrow shrink-0 rounded-full bg-neon/15 px-2 py-0.5 font-mono text-neon">
          Watching
        </span>
      ) : null}
    </button>
  );
}

/**
 * Split-view game switcher — pick which real fixture to watch. Rows come from the same upcoming/live
 * fixtures the hero MatchPicker lists, and selecting one streams it onto the stage through the shared
 * `useLoadReplay` pipeline (live → joinLive, future → pre-match). The on-stage fixture reads "Watching".
 */
export function MatchSelector() {
  const { data: fixtures } = useUpcomingFixtures();
  const { loadReplay } = useLoadReplay();
  const match = useDisplayMatch();
  const switching = useIsSwitching();
  const currentFixtureId = useMatchStore((state) => state.match?.fixtureId);
  const now = Date.now();

  const rows = [...(fixtures ?? [])]
    .sort((a, b) => {
      const liveDelta = Number(isFixtureLive(b, now)) - Number(isFixtureLive(a, now));
      return liveDelta || toMs(a.StartTime) - toMs(b.StartTime);
    })
    .slice(0, MAX_ROWS);

  return (
    <GlassPanel tone="dark" radius="xl" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold tracking-wide">
          <Broadcast className="size-4 text-neon" />
          Live matches
        </span>
        <span className="text-eyebrow font-mono text-muted-foreground">{rows.length} shown</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-foreground/[0.02] px-3 py-4 text-center text-xs text-muted-foreground">
            No fixtures available right now.
          </p>
        ) : (
          rows.map((fixture) => {
            const watching = fixture.FixtureId === currentFixtureId;
            return (
              <MatchRow
                key={fixture.FixtureId}
                fixture={fixture}
                now={now}
                watching={watching}
                loading={watching && switching}
                score={watching ? match.score : null}
                onSelect={() => void loadReplay(fixtureToReplayItem(fixture))}
              />
            );
          })
        )}
      </div>
    </GlassPanel>
  );
}
