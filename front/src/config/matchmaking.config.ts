import { RankTier } from '@/enums/rank-tier.enum';

/** Seconds to accept a found match before the ready-check expires. */
export const ACCEPT_SECONDS = 10;
/** MMR at stake per ranked duel (shown as ±N). */
export const MMR_STAKE = 24;
/** How long the fake search runs before an opponent is "found" (ms). */
export const SEARCH_MS = 2600;

/** Token stakes selectable when challenging a friend directly (fantasy mode only — ranked queue stays MMR-only). */
export const BET_AMOUNTS = [100, 500, 1000, 5000] as const;
/** Pre-selected stake when the challenge dialog opens. */
export const DEFAULT_BET_AMOUNT = 500;

/** Tier badge styling — a metal-plate gradient + label colour per tier. */
export interface RankTierMeta {
  label: string;
  from: string;
  to: string;
  text: string;
}

export const rankTierConfig: Record<RankTier, RankTierMeta> = {
  [RankTier.Bronze]: { label: 'Bronze', from: '#c0863a', to: '#3a2610', text: '#f0c893' },
  [RankTier.Silver]: { label: 'Silver', from: '#c7ccd4', to: '#23282e', text: '#e9edf2' },
  [RankTier.Gold]: { label: 'Gold', from: '#f7e29a', to: '#8f6e1e', text: '#fff4cf' },
  [RankTier.Platinum]: { label: 'Platinum', from: '#7fd3d6', to: '#1a3236', text: '#d6fbff' },
  [RankTier.Diamond]: { label: 'Diamond', from: '#7b4ac0', to: '#2a1640', text: '#e5d5ff' },
  [RankTier.Master]: { label: 'Master', from: '#b6f24a', to: '#2c4a10', text: '#f2ffd6' },
};

export interface Duelist {
  name: string;
  /** FIFA country code (mapped to ISO for the flag). */
  country: string;
  tier: RankTier;
  /** Division within the tier (I highest → III lowest). */
  division: string;
  rating: number;
  wins: number;
  losses: number;
  /** Current streak, e.g. "W5" or "L2". */
  streak: string;
  portraitSrc: string;
}

/** The signed-in player queueing up (mock until profiles come from the API). */
export const selfDuelist: Duelist = {
  name: 'You',
  country: 'BRA',
  tier: RankTier.Gold,
  division: 'II',
  rating: 1420,
  wins: 128,
  losses: 74,
  streak: 'W5',
  portraitSrc: '/personas/p01.png',
};

/** The matched opponent. */
export const opponentDuelist: Duelist = {
  name: 'bleuforce',
  country: 'FRA',
  tier: RankTier.Gold,
  division: 'I',
  rating: 1447,
  wins: 210,
  losses: 150,
  streak: 'W2',
  portraitSrc: '/personas/p07.png',
};
