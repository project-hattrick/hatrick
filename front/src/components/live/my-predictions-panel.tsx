'use client';

import { MyPredictions } from './my-predictions';
import type { PredictionItemData } from './prediction-item';
import { usePredictions } from '@/store/prediction.store';
import { useMatch } from '@/store/match.store';
import { PredictionStatus } from '@/enums/prediction-status.enum';

/** Bottom-left "My Predictions" — adapts store predictions into the DS panel. */
export function MyPredictionsPanel() {
  const predictions = usePredictions();
  const match = useMatch();
  const minute = match?.minute ?? 0;

  const items: PredictionItemData[] = predictions.map((prediction) => {
    const pending = prediction.status === PredictionStatus.Pending;
    return {
      id: prediction.id,
      market: prediction.market,
      label: prediction.label,
      status: prediction.status,
      points: prediction.points,
      resolutionProgress: pending ? Math.min(1, (minute % 5) / 5) : undefined,
      resolutionCaption: pending ? `Resolves around ${minute + 1}'` : undefined,
    };
  });

  const active = predictions.filter((prediction) => prediction.status === PredictionStatus.Pending).length;
  const summary = <span className="text-xs font-bold text-neon">{active} active</span>;

  return <MyPredictions items={items} summary={summary} />;
}
