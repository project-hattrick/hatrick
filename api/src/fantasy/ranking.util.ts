import { DuelResult, RankTier } from '@prisma/client';

/** Tier floors (mmr → tier), high to low. Mirrors the front `RankTier` order. */
const TIER_BANDS: Array<{ min: number; tier: RankTier }> = [
  { min: 1800, tier: RankTier.Master },
  { min: 1650, tier: RankTier.Diamond },
  { min: 1500, tier: RankTier.Platinum },
  { min: 1350, tier: RankTier.Gold },
  { min: 1200, tier: RankTier.Silver },
  { min: 0, tier: RankTier.Bronze },
];

/**
 * MMR → competitive tier + division. Denormalized onto `User` and recomputed on
 * every duel settle so tier/division always track the live rating.
 */
export function rankFromMmr(mmr: number): { tier: RankTier; division: string } {
  const band = TIER_BANDS.find((b) => mmr >= b.min) ?? TIER_BANDS[TIER_BANDS.length - 1];
  const offset = mmr - band.min;
  // Division I (top) → III (bottom) by position within the 150-wide band.
  const division = offset >= 100 ? 'I' : offset >= 50 ? 'II' : 'III';
  return { tier: band.tier, division };
}

/** Extend or flip the W/L streak string (e.g. "W3"); a draw leaves it unchanged. */
export function nextStreak(current: string | null, result: DuelResult): string | null {
  if (result === DuelResult.Draw) return current;
  const mark = result === DuelResult.Win ? 'W' : 'L';
  if (current && current.startsWith(mark)) {
    const n = Number(current.slice(1)) || 0;
    return `${mark}${n + 1}`;
  }
  return `${mark}1`;
}
