import { MarketType } from '@/enums/market-type.enum';
import type { BetSelection } from '@/types/bet';

/** A market surfaced on the Live odds board, with its pickable selections. */
export interface MarketDef {
  market: MarketType;
  title: string;
  selections: BetSelection[];
}

const sel = (market: MarketType, selectionId: string, label: string, odds: number): BetSelection => ({
  market,
  selectionId,
  label,
  odds,
});

/**
 * Odds board for the mock fixture (ARG vs FRA). Odds are decimal; the mock
 * settlement driver treats the implied probability (1/odds) as the win chance,
 * so higher odds settle as wins less often — self-consistent play-money betting.
 */
export const BETTING_MARKETS: MarketDef[] = [
  {
    market: MarketType.MatchResult,
    title: 'Match Result',
    selections: [
      sel(MarketType.MatchResult, 'home', 'Argentina', 2.1),
      sel(MarketType.MatchResult, 'draw', 'Draw', 3.25),
      sel(MarketType.MatchResult, 'away', 'France', 2.35),
    ],
  },
  {
    market: MarketType.NextGoal,
    title: 'Next Goal',
    selections: [
      sel(MarketType.NextGoal, 'home', 'Argentina', 2.0),
      sel(MarketType.NextGoal, 'none', 'No more goals', 3.4),
      sel(MarketType.NextGoal, 'away', 'France', 2.05),
    ],
  },
  {
    market: MarketType.TotalGoals,
    title: 'Total Goals',
    selections: [
      sel(MarketType.TotalGoals, 'over', 'Over 2.5', 1.72),
      sel(MarketType.TotalGoals, 'under', 'Under 2.5', 2.1),
    ],
  },
  {
    market: MarketType.PlayerToScore,
    title: 'Player to Score',
    selections: [
      sel(MarketType.PlayerToScore, 'messi', 'L. Messi', 2.8),
      sel(MarketType.PlayerToScore, 'mbappe', 'K. Mbappé', 2.6),
      sel(MarketType.PlayerToScore, 'lautaro', 'L. Martínez', 3.9),
    ],
  },
  {
    market: MarketType.Corners,
    title: 'Corners',
    selections: [
      sel(MarketType.Corners, 'over', 'Over 9.5', 1.9),
      sel(MarketType.Corners, 'under', 'Under 9.5', 1.9),
    ],
  },
  {
    market: MarketType.Cards,
    title: 'Cards',
    selections: [
      sel(MarketType.Cards, 'over', 'Over 3.5', 2.2),
      sel(MarketType.Cards, 'under', 'Under 3.5', 1.65),
    ],
  },
];

/** The mock fixture these odds belong to (ARG vs FRA). */
export const BETTING_MATCH_LABEL = 'ARG vs FRA';
