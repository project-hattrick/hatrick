'use client';

import { useRealGkStore } from '@/store/real-gk.store';
import { cn } from '@/lib/utils';

/**
 * Broadcast scoreboard for the /engine — mirrors the HUD store the engine pushes via `bridgeHud`
 * (team names, score, clock) so goals/events visibly land on screen like the main surfaces. The status
 * line surfaces the current beat (Goal! / Corner / Yellow card / …) and dims when there's nothing to say.
 */
export function EngineScoreboard({ className }: { className?: string }) {
  const blue = useRealGkStore((s) => s.teamBlueName);
  const red = useRealGkStore((s) => s.teamRedName);
  const scoreBlue = useRealGkStore((s) => s.scoreBlue);
  const scoreRed = useRealGkStore((s) => s.scoreRed);
  const clock = useRealGkStore((s) => s.clock);
  const status = useRealGkStore((s) => s.statusTitle);

  return (
    <div className={cn('pointer-events-none flex flex-col items-center gap-1', className)}>
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/60 px-4 py-1.5 text-white shadow-xl backdrop-blur-md">
        <span className="max-w-[130px] truncate text-sm font-semibold">{blue}</span>
        <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-base font-bold tabular-nums">
          {scoreBlue} - {scoreRed}
        </span>
        <span className="max-w-[130px] truncate text-sm font-semibold">{red}</span>
        <span className="ml-1 border-l border-white/15 pl-3 font-mono text-xs tabular-nums text-white/70">{clock}</span>
      </div>
      {status ? (
        <div className="rounded bg-black/50 px-3 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/80 backdrop-blur-md">
          {status}
        </div>
      ) : null}
    </div>
  );
}
