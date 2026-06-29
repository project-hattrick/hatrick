import { env } from '@/lib/env';
import { MarketType } from '@/enums';

export interface PlacePredictionInput {
  fixtureId: number;
  market: MarketType;
  label: string;
  points: number;
}

/** Free-to-play prediction seam (distinct from off-chain betting). */
export const predictionService = {
  place: async (input: PlacePredictionInput): Promise<{ ok: boolean }> => {
    if (env.useMock) return { ok: true };
    const res = await fetch(`${env.apiUrl}/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return { ok: res.ok };
  },
};
