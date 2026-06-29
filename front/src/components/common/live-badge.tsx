import { cn } from '@/lib/utils';
import { formatMinute } from '@/lib/format';

interface LiveBadgeProps {
  minute?: number;
  className?: string;
}

/** Pulsing dot + LIVE label, with an optional neon match minute. */
function LiveBadge({ minute, className }: LiveBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-bold text-live', className)}>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
      LIVE
      {minute !== undefined ? <span className="ml-1 text-neon">{formatMinute(minute)}</span> : null}
    </span>
  );
}

export { LiveBadge };
