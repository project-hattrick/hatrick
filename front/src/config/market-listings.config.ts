import { PACK_POOL, type PackCard } from '@/config/pack-pool.config';

/** A card up for sale on the internal player market. */
export interface Listing {
  id: string;
  card: PackCard;
  price: number;
}

/** Coin price scaled off the card rating (number) — a 97 costs ≈1.7M, a 65 ≈750k. */
export function priceFor(card: PackCard): number {
  const rating = card.number ?? 70;
  return Math.round(rating * rating * 180);
}

/** Seed listings — a fixed slice of the full pool so the market looks stocked. */
export const SEED_LISTINGS: Listing[] = PACK_POOL.slice(0, 12).map((card, i) => ({
  id: `listing-${i}`,
  card,
  price: priceFor(card),
}));
