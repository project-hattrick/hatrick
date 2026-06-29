'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { PredictionRow } from './prediction-row';
import { usePredictions } from '@/store/prediction.store';

/** Bottom-left "My Predictions" panel. */
export function MyPredictionsPanel() {
  const predictions = usePredictions();

  return (
    <GlassPanel tone="surface" className="flex w-full flex-col overflow-hidden md:w-[320px]">
      <SectionHeader title="My Predictions" className="border-b border-border/60 bg-surface-1/60" />
      <div className="flex flex-col divide-y divide-border/40">
        {predictions.map((prediction) => (
          <PredictionRow key={prediction.id} prediction={prediction} />
        ))}
      </div>
    </GlassPanel>
  );
}
