import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { predictionStatusConfig, predictionStatusFallback } from '@/config/prediction.config';
import { formatPoints } from '@/lib/format';
import { PredictionStatus } from '@/enums/prediction-status.enum';
import type { Prediction } from '@/types/prediction';

/** One row in the "My Predictions" panel. */
export function PredictionRow({ prediction }: { prediction: Prediction }) {
  const meta = lookup(predictionStatusConfig, prediction.status, predictionStatusFallback);
  const won = prediction.status === PredictionStatus.Won;

  return (
    <div className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/5">
      <div className="flex items-start gap-2.5">
        <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full', meta.dotClass)} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-foreground">{prediction.label}</span>
          <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">{meta.label}</span>
        </div>
      </div>
      <span className={cn('flex items-center gap-1.5 text-sm font-bold', meta.tone)}>
        {won ? <Check className="size-3" /> : null}
        {formatPoints(prediction.points)}
      </span>
    </div>
  );
}
