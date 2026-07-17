/**
 * Front mirror of the API store catalog seed (prices in coins, initial stock) —
 * drives the mock mode and maps products to their stable slugs. Data is
 * duplicated on purpose: apps never cross-import (docs/conventions.md).
 */

export interface StoreCatalogSeed {
  slug: string;
  kind: 'Pack' | 'Bundle' | 'Card';
  name: string;
  /** Price in coins (display SOL = price / 100k). */
  price: number;
  /** Initial units for the mock shop. */
  stock: number;
}

export const STORE_CATALOG_SEED: StoreCatalogSeed[] = [
  { slug: 'legendary-pack', kind: 'Pack', name: 'Legendary Pack', price: 200_000, stock: 12 },
  { slug: 'pro-pack', kind: 'Pack', name: 'Pro Pack', price: 120_000, stock: 25 },
  { slug: 'starter-pack', kind: 'Pack', name: 'Starter Pack', price: 50_000, stock: 40 },
  { slug: 'limited-bundle', kind: 'Bundle', name: 'Limited Bundle', price: 350_000, stock: 8 },
  { slug: 'midfield-bundle', kind: 'Bundle', name: 'Midfield Bundle', price: 250_000, stock: 15 },
  { slug: 'card-mbappe', kind: 'Card', name: 'Mbappe Pick', price: 80_000, stock: 3 },
  { slug: 'card-haaland', kind: 'Card', name: 'Haaland Pick', price: 70_000, stock: 5 },
  { slug: 'card-messi', kind: 'Card', name: 'Messi Pick', price: 65_000, stock: 5 },
  { slug: 'card-vini', kind: 'Card', name: 'Vini Pick', price: 60_000, stock: 8 },
  { slug: 'card-bellingham', kind: 'Card', name: 'Bellingham Pick', price: 50_000, stock: 10 },
];

/** Market-pick slug for a fantasy card id (matches the API seed slugs). */
export const pickSlug = (cardId: string): string => `card-${cardId}`;

export const seedFor = (slug: string): StoreCatalogSeed | undefined =>
  STORE_CATALOG_SEED.find((item) => item.slug === slug);
