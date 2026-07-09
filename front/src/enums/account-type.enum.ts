/**
 * Login tier chosen at sign-up — mirrors the api `AccountType` (members match by name).
 * Competitor = wallet-linked ("I want to win": prizes, on-chain ownership);
 * Collector = casual email/Google ("just open packs & see stats").
 */
export enum AccountType {
  Competitor = 'competitor',
  Collector = 'collector',
}
