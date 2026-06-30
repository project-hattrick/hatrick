import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { predictionStatusConfig, predictionStatusFallback } from '@/config/prediction.config';
import { toneConfig, toneFallback } from '@/config/tone.config';
import { PredictionStatus } from '@/enums/prediction-status.enum';

interface StatusPillProps {
  status: PredictionStatus;
  className?: string;
}

/** Compact status chip — pending|won|lost mapped to neutral|positive|danger roles. */
function StatusPill({ status, className }: StatusPillProps) {
  const meta = lookup(predictionStatusConfig, status, predictionStatusFallback);
  const tone = lookup(toneConfig, meta.role, toneFallback);
  const resolved = status !== PredictionStatus.Pending;

  return (
    <span
      role="status"
      aria-label={meta.label}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase',
        tone.soft,
        resolved && 'motion-resolve',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', tone.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

export { StatusPill };
