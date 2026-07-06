import type { MarketType } from '@/enums/market-type.enum';
import type { BetStatus } from '@/enums/bet-status.enum';

/** A pickable outcome within a market (the bet-slip selection). */
export interface BetSelection {
  market: MarketType;
  /** Stable id within the market (e.g. 'home', 'over'). */
  selectionId: string;
  /** Display label, e.g. "Argentina" or "Over 2.5". */
  label: string;
  odds: number;
}

/** A placed staked bet — mirrors the bet.service BuildBetInput shape for an easy backend swap. */
export interface Bet extends BetSelection {
  id: string;
  fixtureId: number;
  /** "ARG vs FRA" for the row caption. */
  matchLabel: string;
  stake: number;
  status: BetStatus;
  /** ms epoch when placed. */
  placedAt: number;
  /** ms epoch when the mock driver resolves it (settlement seam). */
  settleAt: number;
  /** Backend bet id once persisted (authed users) — drives server-side settlement. */
  serverId?: string;
}
