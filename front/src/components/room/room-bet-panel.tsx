'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { MarketIcon } from '@/components/live/market-icon';
import { MarketType } from '@/enums/market-type.enum';
import { useLiveMarkets } from '@/hooks/use-live-markets';
import { marketTypeConfig, marketTypeFallback } from '@/config/market-type.config';
import { teamColor } from '@/config/team-colors.config';
import { fifaToIso } from '@/lib/country';
import { lookup } from '@/lib/lookup';
import { cn } from '@/lib/utils';
import { useBetsStore } from '@/store/bets.store';
import { useDisplayMatch, useIsMatchLive } from '@/store/match.store';
import type { BetSelection } from '@/types/bet';
import { RoomHeroArt } from './room-hero-art';
import { FeaturedResultCell, LivelyOddsCell } from './room-market-cells';

/**
 * The room's bet widget: hero-card art header for the live match, a featured
 * Match Result market (1·X·2) and the remaining markets with lively cells.
 * Selection wiring is identical to MarketsPanel — picks load the shared BetSlip.
 */
export function RoomBetPanel({ className }: { className?: string }) {
  const slip = useBetsStore((state) => state.slip);
  const select = useBetsStore((state) => state.select);
  const match = useDisplayMatch();
  const canBet = useIsMatchLive();
  const markets = useLiveMarkets();

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

  return (
    <GlassPanel radius="xl" tone="surface" className={cn('flex min-h-0 flex-col overflow-hidden p-0', className)}>
      <RoomHeroArt />

      {/* data-lenis-prevent: Lenis owns the page wheel; without it the widget never scrolls. */}
      <div data-lenis-prevent className="custom-scrollbar flex min-h-0 flex-1 flex-col divide-y divide-border/40 overflow-y-auto">
        {!canBet && (
          <div className="bg-surface-1/70 px-4 py-2 text-xs font-semibold text-muted-foreground">
            Betting closed for this match.
          </div>
        )}
        {featured && (
          <section className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-foreground uppercase">
              <MarketIcon market={featured.market} className="size-4 text-neon" />
              {lookup(marketTypeConfig, featured.market, marketTypeFallback).label}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {featured.selections.map((selection) => {
                const display = withLiveNames(selection);
                return (
                  <FeaturedResultCell
                    key={selection.selectionId}
                    selection={display}
                    accentColor={accentFor(selection.selectionId)}
                    active={isActive(selection)}
                    disabled={!canBet}
                    onPick={() => select(display)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {others.map((def) => {
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
                      disabled={!canBet}
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
