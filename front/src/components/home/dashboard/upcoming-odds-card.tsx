'use client';

import { toast } from 'sonner';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { Clock } from '@/components/common/icons';
import { MarketType } from '@/enums/market-type.enum';
import { TeamSide } from '@/enums/team-side.enum';
import { useLoadReplay } from '@/hooks/use-load-replay';
import { foldResultOdds } from '@/lib/live-odds';
import { fifaToIso } from '@/lib/country';
import { useFixtureOdds, useUpcomingFixtures } from '@/services/queries/use-replay';
import { teamInfoFromName } from '@/config/teams.config';
import { useBetsStore } from '@/store/bets.store';
import type { FixtureDto } from '@/services/txline.service';

const MAX_FIXTURES = 4;
const toMs = (value: number) => (value < 1e12 ? value * 1000 : value);
const kickoffLabel = (ms: number) =>
  new Date(ms).toLocaleString('en', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

/** One upcoming fixture with its pre-match 1X2 — tapping a price loads the match AND stages the bet. */
function FixtureOddsRow({ fixture }: { fixture: FixtureDto }) {
  const odds = useFixtureOdds(fixture.FixtureId);
  const { loadReplay } = useLoadReplay();
  const select = useBetsStore((state) => state.select);

  const ms = toMs(fixture.StartTime);
  const book = odds.data ? foldResultOdds(odds.data) : null;
  const homeCode = teamInfoFromName(fixture.Participant1, TeamSide.Home).code;
  const awayCode = teamInfoFromName(fixture.Participant2, TeamSide.Away).code;

  const openFixture = () =>
    loadReplay({
      fixtureId: fixture.FixtureId,
      home: fixture.Participant1,
      away: fixture.Participant2,
      competition: '',
      startTime: ms,
      epochDay: Math.floor(ms / 86_400_000),
      startHour: new Date(ms).getUTCHours(),
    });

  // Loading the fixture makes it bettable (pre-match), so the selection sticks right after.
  const stageBet = async (selectionId: string, label: string, price: number) => {
    await openFixture();
    select({ market: MarketType.MatchResult, selectionId, label, odds: price });
    toast(`${label} @ ${price.toFixed(2)}`, { description: 'Added to your bet slip — set a stake.' });
  };

  const cell = (selectionId: string, short: string, label: string) => {
    const price = book?.[selectionId];
    if (price == null) return null;
    return (
      <button
        type="button"
        onClick={() => void stageBet(selectionId, label, price)}
        className="flex min-w-0 flex-1 cursor-pointer flex-col items-center rounded-lg border border-border/60 bg-surface-2/60 px-1.5 py-1 transition hover:border-neon/60 hover:bg-neon/10"
      >
        <span className="text-micro font-semibold text-muted-foreground uppercase">{short}</span>
        <span className="font-mono text-xs font-bold tabular-nums text-neon">{price.toFixed(2)}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-overlay/30 px-3 py-2.5">
      <button type="button" onClick={() => void openFixture()} className="flex w-full cursor-pointer items-center justify-between gap-2 text-left">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
          <Flag code={fifaToIso(homeCode)} />
          {homeCode}
          <span className="text-muted-foreground">v</span>
          {awayCode}
          <Flag code={fifaToIso(awayCode)} />
        </span>
        <span className="shrink-0 font-mono text-micro text-muted-foreground">{kickoffLabel(ms)}</span>
      </button>
      {book ? (
        <div className="flex gap-1.5">
          {cell('home', '1', `${fixture.Participant1} to win`)}
          {cell('draw', 'X', 'Draw')}
          {cell('away', '2', `${fixture.Participant2} to win`)}
        </div>
      ) : (
        <span className="text-micro text-muted-foreground">
          {odds.isLoading ? 'Loading odds…' : 'Odds open closer to kickoff'}
        </span>
      )}
    </div>
  );
}

/** Pre-match odds board — upcoming fixtures with their real 1X2, bettable before kickoff. */
export function UpcomingOddsCard() {
  const upcoming = useUpcomingFixtures();
  const fixtures = (upcoming.data ?? []).slice().sort((a, b) => a.StartTime - b.StartTime).slice(0, MAX_FIXTURES);

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">Upcoming Odds</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-micro font-bold text-muted-foreground uppercase">
          <Clock className="size-3.5" /> Pre-match
        </span>
      </div>
      {fixtures.length ? (
        <div className="flex flex-col gap-2">
          {fixtures.map((fixture) => (
            <FixtureOddsRow key={fixture.FixtureId} fixture={fixture} />
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">
          {upcoming.isLoading ? 'Loading fixtures…' : 'No upcoming fixtures right now.'}
        </span>
      )}
    </GlassPanel>
  );
}
