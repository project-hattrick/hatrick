import { PackType } from '@prisma/client';

/** Pack economics — coin cost + how many cards each pack yields. Devnet play-money. */
export interface PackSpec {
  cost: number;
  size: number;
}

export const PACK_SPECS: Record<PackType, PackSpec> = {
  // Free, once (only when the collection is empty). 11 = a full XI to seed the squad.
  [PackType.Welcome]: { cost: 0, size: 11 },
  [PackType.Standard]: { cost: 250_000, size: 5 },
  [PackType.Premium]: { cost: 750_000, size: 11 },
  [PackType.Special]: { cost: 1_500_000, size: 11 },
};

/** MMR swing applied to the host on a duel outcome. */
export const DUEL_MMR_DELTA = 25;
