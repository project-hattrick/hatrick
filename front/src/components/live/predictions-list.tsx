'use client';

import { StatusPill } from './status-pill';
import { MarketIcon } from './market-icon';
import { formatPoints } from '@/lib/format';
import { usePredictions } from '@/store/prediction.store';

/** Free-to-play predictions history for the /bets Predictions tab. */
export function PredictionsList() {
  const predictions = usePredictions();

  if (!predictions.length) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">No predictions yet.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border/30">
      {predictions.map((prediction) => (
        <div key={prediction.id} className="flex items-center gap-3 px-4 py-3">
          <MarketIcon market={prediction.market} className="size-4 shrink-0 text-neon" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{prediction.label}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {formatPoints(prediction.points)} pts
          </span>
          <StatusPill status={prediction.status} />
        </div>
      ))}
    </div>
  );
}
