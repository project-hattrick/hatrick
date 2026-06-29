import { PredictionMarket } from '@/enums/prediction-market.enum';
import { Tone } from '@/enums/tone.enum';

interface PredictionMarketMeta {
  label: string;
  tone: Tone;
}

/** Each market maps to a SEMANTIC role (not a raw color) — drives icon accent + framing. */
export const predictionMarketConfig: Record<PredictionMarket, PredictionMarketMeta> = {
  [PredictionMarket.Goal]: { label: 'Goal', tone: Tone.Positive },
  [PredictionMarket.Shot]: { label: 'Shot', tone: Tone.Info },
  [PredictionMarket.Corner]: { label: 'Corner', tone: Tone.Neutral },
  [PredictionMarket.YellowCard]: { label: 'Yellow Card', tone: Tone.Warning },
  [PredictionMarket.RedCard]: { label: 'Red Card', tone: Tone.Danger },
  [PredictionMarket.Event]: { label: 'Event', tone: Tone.Neutral },
};

export const predictionMarketFallback: PredictionMarketMeta = { label: 'Market', tone: Tone.Neutral };
