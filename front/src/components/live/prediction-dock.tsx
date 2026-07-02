'use client';

import { GlassPanel } from '@/components/common/glass-panel';
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

const NET = 'repeating-linear-gradient(90deg,rgba(255,255,255,.26) 0 1px,transparent 1px 8px),repeating-linear-gradient(0deg,rgba(255,255,255,.26) 0 1px,transparent 1px 8px)';

function clock(seconds: number): string {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Bottom-center "Will there be a goal?" dock — goal illustration header + YES/NO odds. */
export function PredictionDock({ question, secondsLeft, yes, no, onPick, className }: PredictionDockProps) {
  return (
    <GlassPanel
      tone="blur"
      radius="xl"
      aria-label={question}
      className={cn('w-full max-w-[470px] min-w-0 overflow-hidden md:w-[min(470px,44vw)]', className)}
    >
      <div className="relative h-[76px] bg-gradient-to-b from-[#22593a] to-pitch sm:h-[88px] md:h-[96px]">
        <div
          className="absolute top-2.5 left-1/2 h-[44px] w-[124px] -translate-x-1/2 border-2 border-b-0 border-white/75 sm:top-3 sm:h-[50px] sm:w-[140px] md:top-3.5 md:h-[54px] md:w-[150px]"
          style={{ backgroundImage: NET }}
        />
        <div className="absolute bottom-4 left-1/2 size-3 -translate-x-1/2 rounded-full bg-white shadow-md" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />
        <div className="absolute right-16 bottom-2 left-3 sm:right-20 sm:bottom-2.5 sm:left-4">
          <div className="font-mono text-[8px] font-bold tracking-[0.16em] text-neon">● LIVE PREDICTION · FREE</div>
          <div className="truncate text-sm font-bold text-white sm:text-base md:text-[19px]">{question}</div>
        </div>
        <span className="absolute right-3 bottom-2.5 font-mono text-xs font-bold text-neon tabular-nums sm:right-4 sm:bottom-3 sm:text-[15px]">
          {clock(secondsLeft)}
        </span>
      </div>

      <div className="flex gap-2 p-2.5 sm:gap-2.5 sm:p-3.5">
        <button
          type="button"
          onClick={() => onPick?.(yes.label)}
          className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-xl bg-neon px-3 py-2.5 text-primary-foreground transition hover:bg-neon-hover sm:px-3.5 sm:py-3"
        >
          <span className="text-[15px] font-bold">{yes.label}</span>
          <span className="truncate font-mono text-[10px] font-bold sm:text-xs">×{yes.odds} · +{yes.points}</span>
        </button>
        <button
          type="button"
          onClick={() => onPick?.(no.label)}
          className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-foreground transition hover:bg-white/10 sm:px-3.5 sm:py-3"
        >
          <span className="text-[15px] font-bold">{no.label}</span>
          <span className="truncate font-mono text-[10px] font-bold text-muted-foreground sm:text-xs">×{no.odds} · +{no.points}</span>
        </button>
      </div>
    </GlassPanel>
  );
}
