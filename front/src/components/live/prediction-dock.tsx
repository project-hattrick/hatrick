'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

import { MetalButton } from '@/components/ui/metal-button';
import { cn } from '@/lib/utils';

export interface DockOption {
  label: string;
  points: number;
  odds: number;
}

interface PredictionDockProps {
  question: string;
  secondsLeft: number;
  yes: DockOption;
  no: DockOption;
  onPick?: (label: string) => void;
  className?: string;
}

function clock(seconds: number): string {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Compact "Will there be a goal?" dock — art on top, all copy + YES/NO stacked at the bottom. */
export function PredictionDock({ question, secondsLeft, yes, no, onPick, className }: PredictionDockProps) {
  const [total, setTotal] = useState(secondsLeft || 1);
  const [remaining, setRemaining] = useState(secondsLeft);
  const [promptKey, setPromptKey] = useState(`${question}|${secondsLeft}`);

  // Reset the countdown whenever a new prompt arrives — adjust state during render
  // (React's recommended pattern) instead of a synchronous setState inside an effect.
  const nextKey = `${question}|${secondsLeft}`;
  if (promptKey !== nextKey) {
    setPromptKey(nextKey);
    setTotal(secondsLeft || 1);
    setRemaining(secondsLeft);
  }

  // Tick down to 0.
  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [remaining]);

  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));

  return (
    // Padded "bezel" frame (RevenueWidget look) around the overlay card.
    <div
      className={cn(
        'w-full max-w-[460px] min-w-0 rounded-[26px] bg-muted p-1.5 shadow-[0px_0px_0px_1px_rgba(255,255,255,0.05),0px_2px_6px_rgba(0,0,0,0.4),0px_16px_40px_-12px_rgba(0,0,0,0.55)] md:w-[min(460px,44vw)]',
        className,
      )}
    >
      <div
        className="relative h-[224px] w-full overflow-hidden rounded-[20px] ring-1 ring-white/10 sm:h-[248px]"
        aria-label={question}
      >
        <Image src="/prediction-goal.png" alt="" fill sizes="460px" className="object-cover object-center" />
        {/* Gradient so the bottom copy + buttons stay legible; the top stays free art. */}
        <div className="absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/60 to-transparent" />

        {/* Everything stacked at the bottom. */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] font-bold tracking-[0.16em] text-neon [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
              ● LIVE PREDICTION · FREE
            </span>
            <span className="font-mono text-xs font-bold text-neon tabular-nums [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
              {clock(remaining)}
            </span>
          </div>

          {/* Countdown bar depleting to 0. */}
          <div className="h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-neon transition-[width] duration-1000 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="truncate text-sm font-bold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.85)] sm:text-base">
            {question}
          </div>

          <div className="flex items-stretch gap-1.5">
            <MetalButton
              type="button"
              preset="chromatic"
              variant="default"
              strength={1}
              ringCssPx={3}
              onClick={() => onPick?.(yes.label)}
              metalFxClassName="flex-[1.5] cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              className="w-full cursor-pointer justify-between gap-1 px-3.5 py-3 text-sm font-bold text-primary-foreground"
            >
              <span>{yes.label}</span>
              <span className="truncate font-mono text-micro font-semibold text-primary-foreground/80">×{yes.odds} · +{yes.points}</span>
            </MetalButton>
            <button
              type="button"
              onClick={() => onPick?.(no.label)}
              className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-1 rounded-[15px] border border-white/15 bg-white/10 px-3.5 py-3 text-foreground backdrop-blur-sm transition hover:bg-white/15 active:scale-[0.98]"
            >
              <span className="text-sm font-semibold">{no.label}</span>
              <span className="truncate font-mono text-micro font-semibold text-muted-foreground">×{no.odds} · +{no.points}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
