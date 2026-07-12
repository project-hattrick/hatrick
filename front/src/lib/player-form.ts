import type { PlayerMatchStats, PlayerStatsBySide, LineupsBySide } from '@/types/match';

/**
 * Live form derived from REAL per-player feed stats (TxLINE `PlayerStats`).
 * Fantasy surfaces apply the boost on top of a card's base rating so cards
 * visibly evolve with the player's actual match performance.
 */

/** Clamp bounds for a live form swing, in attribute points. */
const MIN_BOOST = -6;
const MAX_BOOST = 9;

/** Attribute delta for a player's current match performance (0 when no stats yet). */
export function liveFormBoost(stats?: PlayerMatchStats): number {
  if (!stats) return 0;
  const raw =
    (stats.goals ?? 0) * 3 +
    (stats.penaltyGoals ?? 0) +
    (stats.shots ?? 0) -
    (stats.yellowCards ?? 0) -
    (stats.redCards ?? 0) * 3 -
    (stats.ownGoals ?? 0) * 2;
  return Math.max(MIN_BOOST, Math.min(MAX_BOOST, raw));
}

/** Real stats for one player ID on a side, or undefined while the feed has none. */
export function statsForPlayer(
  playerStats: PlayerStatsBySide | undefined,
  side: 'home' | 'away',
  playerId: number,
): PlayerMatchStats | undefined {
  return playerStats?.[side]?.[String(playerId)];
}

/** Shirt number for a player ID from the real lineups, or undefined while unknown. */
export function shirtForPlayer(
  lineups: LineupsBySide | null | undefined,
  side: 'home' | 'away',
  playerId: number,
): number | undefined {
  return lineups?.[side]?.find((slot) => slot.playerId === playerId)?.shirt;
}

/** Reverse lookup: the player ID wearing a shirt on a side, or undefined while lineups are unknown. */
export function playerForShirt(
  lineups: LineupsBySide | null | undefined,
  side: 'home' | 'away',
  shirt: number,
): number | undefined {
  return lineups?.[side]?.find((slot) => slot.shirt === shirt)?.playerId;
}
