import type { BetSelection } from '@/types/bet';

/**
 * Normalised implied win probabilities (%) from a market's decimal odds — the bookmaker overround
 * removed so the selections sum to 100. Used to present a past/replayed match as a result board
 * instead of clickable odds.
 */
export function impliedPercents(selections: BetSelection[]): Record<string, number> {
  const raw = selections.map((s) => ({ id: s.selectionId, p: s.odds > 0 ? 1 / s.odds : 0 }));
  const sum = raw.reduce((acc, r) => acc + r.p, 0) || 1;
  return Object.fromEntries(raw.map((r) => [r.id, Math.round((r.p / sum) * 100)]));
}

/** The winning Match Result selection id from the final score (only meaningful once decided). */
export function matchResultWinner(homeScore: number, awayScore: number): 'home' | 'draw' | 'away' {
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return 'draw';
}
