import type { MarketType } from '@/enums/market-type.enum';
import type { PredictionStatus } from '@/enums/prediction-status.enum';

/** A placed free-to-play prediction shown in "My Predictions". */
export interface Prediction {
  id: string;
  market: MarketType;
  label: string;
  status: PredictionStatus;
  points: number;
}

/** The active prediction question offered in the bottom prompt. */
export interface PredictionPrompt {
  id: string;
  question: string;
  market: MarketType;
  yesPoints: number;
  noPoints: number;
  secondsLeft: number;
}
