'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { cn } from '@/lib/utils';
import type { DockOption } from './prediction-dock';

interface PredictionCardProps {
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

/** Compact split-view prediction (wire 3b) — header + segmented YES/NO. */
export function PredictionCard({ question, secondsLeft, yes, no, onPick, className }: PredictionCardProps) {
  return (
    <GlassPanel tone="dark" radius="xl" aria-label={question} className={cn('border-neon/30 p-4', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 font-mono text-micro font-bold tracking-[0.16em] text-neon">● LIVE PREDICTION · FREE</div>
          <div className="text-title leading-tight font-bold text-white">{question}</div>
        </div>
        <span className="shrink-0 font-mono text-base font-bold text-neon tabular-nums">{clock(secondsLeft)}</span>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-surface-3 p-1">
        <button
          type="button"
          onClick={() => onPick?.(yes.label)}
          className="flex-1 rounded-lg bg-neon py-3 text-body font-bold text-primary-foreground transition hover:bg-neon-hover"
        >
          {yes.label} · +{yes.points}
        </button>
        <button
          type="button"
          onClick={() => onPick?.(no.label)}
          className="flex-1 rounded-lg py-3 text-body font-bold text-muted-foreground transition hover:text-foreground"
        >
          {no.label} · +{no.points}
        </button>
      </div>
    </GlassPanel>
  );
}
