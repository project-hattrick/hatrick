import { env } from '@/lib/env';
import { MarketType } from '@/enums';

export interface BuildBetInput {
  walletAddress: string;
  fixtureId: number;
  market: MarketType;
  selection: string;
  amount: number;
  oddsBps?: number;
}

/**
 * On-chain betting seam. The api assembles an unsigned `place_position`
 * transaction (POST /bets/build); the wallet signs it (see use-place-bet).
 * Placing a bet moves the user's tokens, so only the user can sign.
 */
export const betService = {
  buildPlaceBet: async (input: BuildBetInput): Promise<{ transaction: string }> => {
    const res = await fetch(`${env.apiUrl}/bets/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Failed to build bet transaction (${res.status})`);
    return res.json() as Promise<{ transaction: string }>;
  },
};
