'use client';

import { useMemo } from 'react';

import { GlassPanel } from '@/components/common/glass-panel';
import { MarketIcon } from '@/components/live/market-icon';
import { MarketType } from '@/enums/market-type.enum';
import { useLiveMarkets } from '@/hooks/use-live-markets';
import { marketTypeConfig, marketTypeFallback } from '@/config/market-type.config';
import { teamColor } from '@/config/team-colors.config';
import { fifaToIso } from '@/lib/country';
import { lookup } from '@/lib/lookup';
import { cn } from '@/lib/utils';
import { impliedPercents, matchResultWinner } from '@/lib/implied-odds';
import { useFixtureScoreQuery } from '@/services/queries/use-replay';
import { useBetsStore } from '@/store/bets.store';
import { useDisplayMatch, useIsMatchLive, useIsReplay } from '@/store/match.store';
import type { BetSelection } from '@/types/bet';
import { RoomHeroArt } from './room-hero-art';
import { RoomMatchSummary } from './room-match-summary';
import { FeaturedResultCell, LivelyOddsCell, PastResultCell } from './room-market-cells';

/**
 * The room's bet widget: hero-card art header for the live match, a featured
 * Match Result market (1·X·2) and the remaining markets with lively cells.
 * Selection wiring is identical to MarketsPanel — picks load the shared BetSlip.
 */
export function RoomBetPanel({ className }: { className?: string }) {
  const slip = useBetsStore((state) => state.slip);
  const select = useBetsStore((state) => state.select);
  const match = useDisplayMatch();
  const isReplay = useIsReplay();
  const isMatchLive = useIsMatchLive();
  const markets = useLiveMarkets();

  // A replay already happened — betting is off and the Match Result market becomes a read-only
  // FINAL-result board (authoritative score, never the playback minute's odds).
  const bettable = isMatchLive && !isReplay;
  const finalScoreQuery = useFixtureScoreQuery(isReplay ? match.fixtureId : null);
  const snap = finalScoreQuery.data;
  const final = isReplay && snap?.finished ? { home: snap.home, away: snap.away } : null;
  const winner = final ? matchResultWinner(final.home, final.away) : null;

  // Home/away selections carry the live team names (mirrors MarketsPanel).
  const withLiveNames = (selection: BetSelection): BetSelection => {
    const team =
      selection.selectionId === 'home' ? match.home.name : selection.selectionId === 'away' ? match.away.name : null;
    return team ? { ...selection, label: team } : selection;
  };

  const isActive = (selection: BetSelection) =>
    slip?.market === selection.market && slip?.selectionId === selection.selectionId;

  const accentFor = (selectionId: string): string | null => {
    if (selectionId === 'home') return teamColor(fifaToIso(match.home.code));
    if (selectionId === 'away') return teamColor(fifaToIso(match.away.code));
    return null;
  };

  const featured = markets.find((def) => def.market === MarketType.MatchResult);
  const others = markets.filter((def) => def.market !== MarketType.MatchResult);
  const featuredPct = useMemo(() => (featured ? impliedPercents(featured.selections) : {}), [featured]);

  return (
    <GlassPanel radius="xl" tone="surface" className={cn('flex min-h-0 flex-col overflow-hidden p-0', className)}>
      <RoomHeroArt />

      {/* data-lenis-prevent: Lenis owns the page wheel; without it the widget never scrolls. */}
      <div data-lenis-prevent className="custom-scrollbar flex min-h-0 flex-1 flex-col divide-y divide-border/40 overflow-y-auto">
        {!bettable && (
          <div className="bg-surface-1/70 px-4 py-2 text-xs font-semibold text-muted-foreground">
            This match already happened — betting is closed.{' '}
            {final ? 'Final result shown below.' : 'Win probability shown below.'}
          </div>
        )}
        {featured && (
          <section className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-foreground uppercase">
              <MarketIcon market={featured.market} className="size-4 text-neon" />
              {lookup(marketTypeConfig, featured.market, marketTypeFallback).label}
              {!bettable && (
                <span className="ml-auto text-micro font-semibold normal-case tracking-normal text-muted-foreground">
                  {final ? 'Final result' : 'Win probability'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {featured.selections.map((selection) => {
                const display = withLiveNames(selection);
                if (!bettable) {
                  const id = selection.selectionId;
                  const won = winner === id;
                  return (
                    <PastResultCell
                      key={id}
                      selection={display}
                      value={final ? (id === 'draw' ? '–' : String(final[id as 'home' | 'away'])) : `${featuredPct[id] ?? 0}%`}
                      won={won}
                      tag={final ? (won ? (id === 'draw' ? 'Draw' : 'Winner') : '—') : null}
                      accentColor={accentFor(id)}
                    />
                  );
                }
                return (
                  <FeaturedResultCell
                    key={selection.selectionId}
                    selection={display}
                    accentColor={accentFor(selection.selectionId)}
                    active={isActive(selection)}
                    disabled={false}
                    onPick={() => select(display)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* A replay gets the whole match's rundown where the live markets would be. */}
        {!bettable && snap && (
          <RoomMatchSummary fixtureId={match.fixtureId} actions={snap.actions} />
        )}

        {/* Secondary markets are only meaningful while the match is genuinely bettable. */}
        {bettable &&
          others.map((def) => {
            const meta = lookup(marketTypeConfig, def.market, marketTypeFallback);
            return (
              <section key={def.market} className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-foreground uppercase">
                  <MarketIcon market={def.market} className="size-4 text-neon" />
                  {meta.label}
                </div>
                {/* Stacked full-width rows — the 330px rail truncated side-by-side cells into "S… 2.00". */}
                <div className="flex flex-col gap-1.5">
                  {def.selections.map((selection) => {
                    const display = withLiveNames(selection);
                    return (
                      <LivelyOddsCell
                        key={selection.selectionId}
                        selection={display}
                        active={isActive(selection)}
                        disabled={false}
                        onPick={() => select(display)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </GlassPanel>
  );
}
