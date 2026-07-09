import { REAL_GK_MATCH_CONFIG, type RealGkConfig, type RealGkFeatures } from '@/game/realgk/config';
import { userCards } from '@/config/fantasy-cards.config';

/**
 * Timing of the simulated duel: 90 simulated minutes compressed into ~5 real minutes (2×2:30 plus the
 * interval beat). The chance-battle simulator (src/lib/duel-sim) pre-rolls the match; the duel director
 * (use-duel-director) schedules its beats over this window and drives the arena engine.
 */
export const DUEL_HALF_REAL_SECONDS = 150;
export const DUEL_HALF_MATCH_MINUTES = 45;
/** How long the half-time beat holds before the second-half kickoff. */
export const DUEL_HALFTIME_REAL_SECONDS = 6;
/** Whistle + winner-celebration hold after 90' before the result dialog settles the duel. */
export const DUEL_FULLTIME_HOLD_SECONDS = 5;
/** Director tick — how often the sim minute advances and due beats are dispatched. */
export const DUEL_TICK_MS = 250;

/** The duel arena variant: the full-match look with the match-structure beats (HT walk-off, FT whistle)
 *  and driven filler so the pitch stays alive between the simulator's chance beats. */
export const DUEL_ARENA_CONFIG: RealGkConfig = {
  ...REAL_GK_MATCH_CONFIG,
  features: { ...(REAL_GK_MATCH_CONFIG.features as RealGkFeatures), matchStructure: true, drivenFiller: true },
};

/** Mock opponent deck until real matchmaking carries the rival's cards (shared by both duel layouts). */
export const OPPONENT_DECK = [...userCards].reverse();
