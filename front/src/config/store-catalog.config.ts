/**
 * Front mirror of the API store catalog seed (prices in coins, initial stock) —
 * drives the mock mode and maps products to their stable slugs. Data is
 * duplicated on purpose: apps never cross-import (docs/conventions.md).
 */

export interface StoreCatalogSeed {
  slug: string;
  /** Price in coins (display SOL = price / 100k). */
  price: number;
  /** Initial units for the mock shop. */
  stock: number;
}

export const STORE_CATALOG_SEED: StoreCatalogSeed[] = [
  { slug: 'legendary-pack', price: 200_000, stock: 12 },
  { slug: 'pro-pack', price: 120_000, stock: 25 },
  { slug: 'starter-pack', price: 50_000, stock: 40 },
  { slug: 'limited-bundle', price: 350_000, stock: 8 },
  { slug: 'midfield-bundle', price: 250_000, stock: 15 },
  { slug: 'card-mbappe', price: 295_000, stock: 3 },
  { slug: 'card-haaland', price: 245_000, stock: 5 },
  { slug: 'card-messi', price: 235_000, stock: 5 },
  { slug: 'card-vini', price: 215_000, stock: 8 },
  { slug: 'card-bellingham', price: 185_000, stock: 10 },
];

/** Market-pick slug for a fantasy card id (matches the API seed slugs). */
export const pickSlug = (cardId: string): string => `card-${cardId}`;

export const seedFor = (slug: string): StoreCatalogSeed | undefined =>
  STORE_CATALOG_SEED.find((item) => item.slug === slug);
