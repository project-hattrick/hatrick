import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { formatPoints } from '@/lib/format';
import { StatusPill } from './status-pill';
import { MarketIcon } from './market-icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { predictionStatusConfig, predictionStatusFallback } from '@/config/prediction.config';
import { marketTypeConfig, marketTypeFallback } from '@/config/market-type.config';
import { toneConfig, toneFallback } from '@/config/tone.config';
import { PredictionStatus } from '@/enums/prediction-status.enum';
import { MarketType } from '@/enums/market-type.enum';

export interface PredictionItemData {
  id: string;
  market: MarketType;
  label: string;
  status: PredictionStatus;
  points: number;
  resolutionProgress?: number;
  resolutionCaption?: string;
}

/** One row: market icon + label + status pill + points. Pending rows reveal a resolution bar below. */
function PredictionItem({ market, label, status, points, resolutionProgress, resolutionCaption }: PredictionItemData) {
  const meta = lookup(predictionStatusConfig, status, predictionStatusFallback);
  const statusTone = lookup(toneConfig, meta.role, toneFallback);
  const marketMeta = lookup(marketTypeConfig, market, marketTypeFallback);
  const accent = lookup(toneConfig, marketMeta.tone, toneFallback);
  const pending = status === PredictionStatus.Pending;

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', accent.soft)}>
            <MarketIcon market={market} className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{label}</span>
        </div>
        <StatusPill status={status} />
        <span
          className={cn(
            'shrink-0 text-sm font-bold tabular-nums transition-colors duration-[var(--duration-base)] ease-soft',
            statusTone.text,
          )}
        >
          {formatPoints(points)}
        </span>
      </div>

      {pending ? (
        <div className="flex flex-col gap-1 pl-9">
          <ProgressBar value={resolutionProgress ?? 0} tone={marketMeta.tone} label={resolutionCaption} />
          {resolutionCaption ? <span className="text-xs text-muted-foreground">{resolutionCaption}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export { PredictionItem };
