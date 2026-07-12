import type { PlayerMatchStats } from '../../txline/txline.types';

/** The six card attributes (see CardDto). Live form nudges these + the overall rating. */
export type CardStats = Record<'pac' | 'sho' | 'pas' | 'dri' | 'def' | 'phy', number>;

export interface FormDelta {
  stats: Partial<CardStats>;
  rating: number;
}

const clamp = (value: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, value));

/**
 * Bounded "live form" delta for one player from a match's cumulative TxLINE stats. This is the
 * minimal, demonstrable version of the pitch ("attributes driven by real data"): goals lift the
 * shooting/rating, shots nudge shooting, discipline (cards, own goals) drags defence/rating down.
 * TxLINE's per-player blob only carries goals/shots/penalties/cards, so the formula stays within
 * that vocabulary. Per-match deltas are capped so a single game can't warp a card.
 */
export function computeFormDelta(stats: PlayerMatchStats): FormDelta {
  const goals = stats.goals ?? 0;
  const shots = stats.shots ?? 0;
  const penaltyGoals = stats.penaltyGoals ?? 0;
  const yellow = stats.yellowCards ?? 0;
  const red = stats.redCards ?? 0;
  const ownGoals = stats.ownGoals ?? 0;

  const sho = clamp(Math.round(goals * 2 + shots * 0.3 + penaltyGoals), 0, 6);
  const dri = clamp(Math.round(goals), 0, 3);
  const def = -clamp(Math.round(yellow + red * 3 + ownGoals * 2), 0, 6);
  const phy = -clamp(red, 0, 2);
  const rating = clamp(
    Math.round(goals * 1.5 + shots * 0.2 + penaltyGoals * 0.5 - yellow * 0.5 - red * 2 - ownGoals * 1.5),
    -4,
    5,
  );

  const delta: Partial<CardStats> = {};
  if (sho) delta.sho = sho;
  if (dri) delta.dri = dri;
  if (def) delta.def = def;
  if (phy) delta.phy = phy;
  return { stats: delta, rating };
}

/** Apply a delta to a base stats/rating pair, clamping every attribute to 1..99. */
export function applyFormDelta(
  base: CardStats,
  baseRating: number,
  delta: FormDelta,
): { stats: CardStats; rating: number } {
  const stats = { ...base };
  for (const key of Object.keys(delta.stats) as (keyof CardStats)[]) {
    stats[key] = clamp((base[key] ?? 0) + (delta.stats[key] ?? 0), 1, 99);
  }
  return { stats, rating: clamp(baseRating + delta.rating, 1, 99) };
}

/** True when a delta would actually move something (skip DB writes for do-nothing rounds). */
export function isMeaningful(delta: FormDelta): boolean {
  return delta.rating !== 0 || Object.keys(delta.stats).length > 0;
}
