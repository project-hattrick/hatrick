import { BetStatus, MarketType } from '@/enums';
import { endpoints } from './endpoints';
import { api } from './http';

export interface BuildBetInput {
  walletAddress: string;
  fixtureId: number;
  market: MarketType;
  selection: string;
  amount: number;
  oddsBps?: number;
}

/** Mirror of the api CreateBetDto (play-money bet). */
export interface PlaceBetInput {
  fixtureId: number;
  market: MarketType;
  selection: string;
  stake: number;
  oddsTaken: number;
}

/** Mirror of the api BetResponseDto (decimal fields are strings). */
export interface ServerBet {
  id: string;
  fixtureId: number;
  market: MarketType;
  selection: string;
  stake: string;
  oddsTaken: string;
  status: BetStatus;
  placedAt: string;
  settledAt: string | null;
}

/** A bet mutation echoes the resulting balance so the wallet can reconcile. */
export interface BetResult {
  bet: ServerBet;
  balance: string;
}

/** Outcomes a client may report for one of its pending bets. */
export type SettleStatus = BetStatus.Won | BetStatus.Lost | BetStatus.Void;

/**
 * Betting seams. `buildPlaceBet` is the on-chain path (POST /bets/build → unsigned
 * Solana tx). `place`/`settle`/`list` are the off-chain play-money ledger (guarded,
 * self-scoped via the session cookie); each mutation returns the new balance.
 */
export const betService = {
  buildPlaceBet: (input: BuildBetInput): Promise<{ transaction: string }> =>
    api.post<{ transaction: string }>(endpoints.bets.build, input),

  place: (input: PlaceBetInput): Promise<BetResult> =>
    api.post<BetResult>(endpoints.bets.base, input),

  settle: (betId: string, status: SettleStatus): Promise<BetResult> =>
    api.post<BetResult>(endpoints.bets.settle(betId), { status }),

  list: (signal?: AbortSignal): Promise<ServerBet[]> =>
    api.get<ServerBet[]>(endpoints.bets.base, signal),
};
