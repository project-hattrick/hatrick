import { PredictionStatus } from '@/enums/prediction-status.enum';
import { Tone } from '@/enums/tone.enum';

interface PredictionStatusMeta {
  label: string;
  tone: string;
  dotClass: string;
  role: Tone;
}

export const predictionStatusConfig: Record<PredictionStatus, PredictionStatusMeta> = {
  [PredictionStatus.Pending]: { label: 'Waiting', tone: 'text-muted-foreground', dotClass: 'bg-muted-foreground', role: Tone.Neutral },
  [PredictionStatus.Won]: { label: 'Won', tone: 'text-neon', dotClass: 'bg-neon', role: Tone.Positive },
  [PredictionStatus.Lost]: { label: 'Lost', tone: 'text-live', dotClass: 'bg-live', role: Tone.Danger },
};

export const predictionStatusFallback: PredictionStatusMeta = predictionStatusConfig[PredictionStatus.Pending];
