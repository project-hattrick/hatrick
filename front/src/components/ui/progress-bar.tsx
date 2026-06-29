import * as React from 'react';
import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { toneConfig, toneFallback } from '@/config/tone.config';
import { Tone } from '@/enums/tone.enum';

interface ProgressBarProps extends Omit<React.ComponentProps<'div'>, 'role'> {
  value: number;
  tone?: Tone;
  label?: string;
}

/** Token-only linear progress. The fill width is a computed proportion, never a fixed size. */
function ProgressBar({ value, tone = Tone.Primary, label, className, ...props }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const accent = lookup(toneConfig, tone, toneFallback);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-[var(--duration-base)] ease-soft', accent.fill)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export { ProgressBar };
