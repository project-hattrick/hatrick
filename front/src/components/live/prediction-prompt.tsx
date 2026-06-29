'use client';

import * as React from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import { usePredictionPrompt } from '@/store/prediction.store';
import { usePlacePrediction } from '@/services/queries';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { formatPoints } from '@/lib/format';
import { cn } from '@/lib/utils';

const toneClass = {
  yes: 'bg-neon text-primary-foreground hover:bg-neon-hover',
  no: 'border border-border/40 bg-surface-3 text-foreground hover:bg-surface-3/70',
};

type PromptButtonProps = React.ComponentProps<'button'> & {
  label: string;
  hint: string;
  tone: keyof typeof toneClass;
};

function PromptButton({ label, hint, tone, className, ...props }: PromptButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-[88px] flex-col items-center justify-center rounded-2xl py-2 font-bold transition disabled:opacity-60',
        toneClass[tone],
        className,
      )}
      {...props}
    >
      <span className="text-[13px] leading-tight">{label}</span>
      <span className="mt-0.5 text-[9px] font-semibold opacity-75">{hint}</span>
    </button>
  );
}

/** Bottom-center free-to-play prompt: "Will there be a Goal?". */
export function PredictionPrompt() {
  const prompt = usePredictionPrompt();
  const placePrediction = usePlacePrediction();
  if (!prompt) return null;

  const choose = (choice: string, points: number) =>
    placePrediction.mutate({
      fixtureId: MOCK_FIXTURE_ID,
      market: prompt.market,
      label: `${prompt.question} ${choice}`,
      points,
    });

  return (
    <GlassPanel radius="xl" className="flex items-center gap-4 p-3 md:gap-6">
      <div className="flex items-center gap-3 pl-2 md:pl-3">
        <span className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-neon text-base font-bold text-neon">
          {prompt.secondsLeft}
        </span>
        <div className="hidden flex-col md:flex">
          <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">Next</span>
          <span className="text-[13px] leading-none font-bold uppercase">Minute</span>
        </div>
      </div>
      <span className="hidden h-10 w-px bg-border md:block" />
      <div className="flex flex-col pr-2">
        <span className="text-[15px] font-bold tracking-wide uppercase md:text-[17px]">{prompt.question}</span>
        <span className="text-[9px] tracking-wider text-muted-foreground uppercase">Free to play · Earns points</span>
      </div>
      <div className="flex gap-2.5">
        <PromptButton
          label="YES"
          hint={`${formatPoints(prompt.yesPoints)} pts`}
          tone="yes"
          disabled={placePrediction.isPending}
          onClick={() => choose('YES', prompt.yesPoints)}
        />
        <PromptButton
          label="NO"
          hint={`${formatPoints(prompt.noPoints)} pts`}
          tone="no"
          disabled={placePrediction.isPending}
          onClick={() => choose('NO', prompt.noPoints)}
        />
      </div>
    </GlassPanel>
  );
}
