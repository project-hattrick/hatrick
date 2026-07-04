import { presenceConfig } from '@/config/presence.config';
import { Presence } from '@/enums/presence.enum';
import { cn } from '@/lib/utils';

interface PresenceDotProps {
  presence: Presence;
  showLabel?: boolean;
}

/** Coloured status dot with an optional text label, driven by presenceConfig. */
export function PresenceDot({ presence, showLabel = false }: PresenceDotProps) {
  const meta = presenceConfig[presence];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2 shrink-0 rounded-full', meta.dot)} />
      {showLabel ? (
        <span className={cn('text-micro', meta.text)}>{meta.label}</span>
      ) : null}
    </span>
  );
}
