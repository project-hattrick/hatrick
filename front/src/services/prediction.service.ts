import { MarketType } from '@/enums';

export interface PlacePredictionInput {
  fixtureId: number;
  market: MarketType;
  label: string;
  points: number;
}

/**
 * Free-to-play prediction seam (distinct from off-chain betting). Local-only this
 * pass — no /predictions backend exists yet; the seam stays so a future controller
 * can slot in without touching callers.
 */
export const predictionService = {
  place: async (_input: PlacePredictionInput): Promise<{ ok: boolean }> => {
    return { ok: true };
  },
};
