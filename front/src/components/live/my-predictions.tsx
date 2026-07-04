import * as React from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { PredictionItem, type PredictionItemData } from './prediction-item';

interface MyPredictionsProps {
  items: PredictionItemData[];
  summary?: React.ReactNode;
}

/** "My Predictions" panel — DS surface + header with summary slot + divided list. */
function MyPredictions({ items, summary }: MyPredictionsProps) {
  return (
    <GlassPanel tone="surface" radius="xl" className="flex w-full flex-col overflow-hidden">
      <SectionHeader title="My Predictions" action={summary} className="border-b border-border bg-surface-1/60" />
      <ul className="flex flex-col divide-y divide-border/50">
        {items.map((item) => (
          <li key={item.id}>
            <PredictionItem {...item} />
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}

export { MyPredictions };
