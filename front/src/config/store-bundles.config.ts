import { BadgeTone } from '@/components/store/store-badge';

/** The distinguishing perk of a bundle — icon mapping lives in the client card. */
export const enum BundleTrait {
  HighOdds = 'high-odds',
  Balanced = 'balanced',
  HighUpside = 'high-upside',
}

export interface BundleTag {
  text: string;
  tone: BadgeTone;
}

export interface Bundle {
  /** Store catalog slug — drives stock and the purchase call. */
  slug: string;
  name: string;
  caption: string;
  price: string;
  trait: BundleTrait;
  tag?: BundleTag;
}

export const storeBundles: Bundle[] = [
  {
    slug: 'limited-bundle',
    name: 'Limited Bundle',
    caption: 'Elite players. Limited time.',
    price: '3.5 SOL',
    trait: BundleTrait.HighOdds,
    tag: { text: 'Hot', tone: BadgeTone.Hot },
  },
  {
    slug: 'midfield-bundle',
    name: 'Midfield Bundle',
    caption: 'Balance your squad.',
    price: '2.5 SOL',
    trait: BundleTrait.Balanced,
    tag: { text: 'New', tone: BadgeTone.Value },
  },
];
