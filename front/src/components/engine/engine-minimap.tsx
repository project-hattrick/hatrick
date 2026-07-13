'use client';

import type { RealGkRadar } from '@/game/realgk/types';
import { cn } from '@/lib/utils';

/** Home (Blue) / away (Red) dot colors — match the on-pitch foot rings. */
const HOME = '#38bdf8';
const AWAY = '#fb7185';

/**
 * Live 2D radar of the /engine match — mirrors the actual on-pitch positions sampled from
 * `handle.sampleRadar()` (lat = along the pitch → horizontal, depth = across → vertical). Blue dots =
 * home, red = away, white = ball. Non-interactive HUD overlay.
 */
export function EngineMinimap({ radar, className }: { radar: RealGkRadar | null; className?: string }) {
  return (
    <div className={cn('pointer-events-none rounded-lg border border-white/10 bg-black/50 p-1.5 shadow-xl backdrop-blur-md', className)}>
      <div className="relative h-[94px] w-[156px] overflow-hidden rounded-md border border-white/10 bg-[repeating-linear-gradient(90deg,#0d2417_0_9%,#0f2a1b_9%_18%)]">
        {/* Pitch markings. */}
        <div className="absolute inset-1 rounded-sm border border-white/10" />
        <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        <div className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1 h-8 w-3 -translate-y-1/2 border border-l-0 border-white/10" />
        <div className="absolute top-1/2 right-1 h-8 w-3 -translate-y-1/2 border border-r-0 border-white/10" />

        {radar?.actors.map((a, i) => (
          <span
            key={`actor-${i}`}
            className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/40 transition-all duration-100 ease-linear"
            style={{ left: `${a.lat * 100}%`, top: `${a.depth * 100}%`, backgroundColor: a.home ? HOME : AWAY }}
          />
        ))}

        {radar ? (
          <span
            className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.85)] transition-all duration-100 ease-linear"
            style={{ left: `${radar.ball.lat * 100}%`, top: `${radar.ball.depth * 100}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}
