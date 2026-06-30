'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { GlassPanel } from '@/components/common/glass-panel';
import { CountdownRing } from './countdown-ring';
import { MarketIcon } from './market-icon';
import { OptionButtons, type PredictionOption } from './option-buttons';
import { StatusPill } from './status-pill';
import { marketTypeConfig, marketTypeFallback } from '@/config/market-type.config';
import { toneConfig, toneFallback } from '@/config/tone.config';
import { formatPoints } from '@/lib/format';
import { MarketType } from '@/enums/market-type.enum';
import { PredictionStatus } from '@/enums/prediction-status.enum';
import { Tone } from '@/enums/tone.enum';

const frameVariants = cva('flex items-center gap-4 p-3 md:gap-5', {
  variants: {
    emphasis: {
      standard: 'ring-1 ring-border',
      rare: 'ring-2 ring-danger',
    },
  },
  defaultVariants: { emphasis: 'standard' },
});

interface LivePredictionBarProps extends VariantProps<typeof frameVariants> {
  market: MarketType;
  question: string;
  windowLabel: string;
  options: PredictionOption[];
  countdown: { seconds: number; max: number };
  state?: 'idle' | 'picked' | 'resolved';
  picked?: string;
  outcome?: PredictionStatus;
  onPick?: (optionLabel: string) => void;
  className?: string;
}

/** Live prediction bar: countdown ring + market question + reward options. */
function LivePredictionBar({
  market,
  emphasis,
  question,
  windowLabel,
  options,
  countdown,
  state = 'idle',
  picked,
  outcome,
  onPick,
  className,
}: LivePredictionBarProps) {
  const marketMeta = lookup(marketTypeConfig, market, marketTypeFallback);
  const accentTone = emphasis === 'rare' ? Tone.Danger : marketMeta.tone;
  const accent = lookup(toneConfig, accentTone, toneFallback);
  const locked = state !== 'idle';
  const pickedOption = options.find((option) => option.label === picked);
  const outcomeTone = lookup(
    toneConfig,
    outcome === PredictionStatus.Won ? Tone.Positive : Tone.Danger,
    toneFallback,
  );

  return (
    <GlassPanel radius="xl" tone="blur" aria-label={question} className={cn(frameVariants({ emphasis }), className)}>
      <CountdownRing seconds={countdown.seconds} max={countdown.max} label={windowLabel} tone={accentTone} />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', accent.soft)}>
          <MarketIcon market={market} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold tracking-wide text-foreground uppercase md:text-base">
            {question}
          </span>
          <span className="truncate text-xs tracking-wide text-muted-foreground uppercase">
            {windowLabel} · Free to play · Earns points
          </span>
        </div>
      </div>

      {state === 'resolved' && outcome ? (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusPill status={outcome} />
          {pickedOption ? (
            <span className={cn('text-sm font-bold tabular-nums', outcomeTone.text)}>
              {formatPoints(pickedOption.points)} pts
            </span>
          ) : null}
        </div>
      ) : (
        <OptionButtons options={options} picked={picked} disabled={locked} onPick={onPick} />
      )}
    </GlassPanel>
  );
}

export { LivePredictionBar };
