'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { cn } from '@/lib/utils';
import { useRealGkStore } from '@/store/real-gk.store';

const BLUE = '#57b8ff';
const RED = '#ff6e78';
const ACCENT = '#f1d772';

/** Scoreboard + status box + possession readout, mirrored from the v2 engine HUD. */
export function RealGkHud() {
  const scoreBlue = useRealGkStore((s) => s.scoreBlue);
  const scoreRed = useRealGkStore((s) => s.scoreRed);
  const clock = useRealGkStore((s) => s.clock);
  const phase = useRealGkStore((s) => s.phase);
  const statusTitle = useRealGkStore((s) => s.statusTitle);
  const statusText = useRealGkStore((s) => s.statusText);
  const ballText = useRealGkStore((s) => s.ballText);
  const uiHidden = useRealGkStore((s) => s.uiHidden);

  return (
    <div className={cn('pointer-events-none fixed inset-x-0 top-3.5 z-10 flex flex-col items-center gap-2 px-4 transition-opacity', uiHidden && 'opacity-0')}>
      <div className="flex w-full max-w-3xl items-start justify-between gap-3">
        <GlassPanel radius="lg" className="flex items-stretch overflow-hidden">
          <div className="px-4 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Blue</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: BLUE }}>
              {scoreBlue}
            </div>
          </div>
          <div className="grid place-items-center border-x border-border/60 px-4 py-2">
            <div className="text-2xl font-bold tabular-nums">{clock}</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{phase}</div>
          </div>
          <div className="px-4 py-2 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Red</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: RED }}>
              {scoreRed}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel radius="lg" className="max-w-[min(420px,45vw)] px-4 py-2">
          <div className="text-sm font-bold uppercase tracking-wide" style={{ color: ACCENT }}>
            {statusTitle}
          </div>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{statusText}</p>
        </GlassPanel>
      </div>

      <GlassPanel radius="pill" className="px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {ballText}
      </GlassPanel>
    </div>
  );
}
