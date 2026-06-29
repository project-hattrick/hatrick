import { env } from '@/lib/env';
import { MarketType } from '@/enums';

export interface PlaceBetInput {
  fixtureId: number;
  market: MarketType;
  selection: string;
  stake: number;
}

/** Off-chain betting seam. On-chain settlement is Phase 2 (see docs). */
export const betService = {
  placeBet: async (input: PlaceBetInput): Promise<{ ok: boolean }> => {
    const res = await fetch(`${env.apiUrl}/bets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return { ok: res.ok };
  },
};
