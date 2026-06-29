import { PredictionStatus } from '@/enums/prediction-status.enum';

interface PredictionStatusMeta {
  label: string;
  tone: string;
  dotClass: string;
}

export const predictionStatusConfig: Record<PredictionStatus, PredictionStatusMeta> = {
  [PredictionStatus.Pending]: { label: 'Waiting', tone: 'text-muted-foreground', dotClass: 'bg-muted-foreground' },
  [PredictionStatus.Won]: { label: 'Won', tone: 'text-neon', dotClass: 'bg-neon' },
  [PredictionStatus.Lost]: { label: 'Lost', tone: 'text-live', dotClass: 'bg-live' },
};

export const predictionStatusFallback: PredictionStatusMeta = predictionStatusConfig[PredictionStatus.Pending];
