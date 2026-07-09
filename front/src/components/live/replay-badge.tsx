'use client';

import { ClockCounterClockwise } from '@/components/common/icons';
import { useIsMatchLive, useIsReplay } from '@/store/match.store';

/** Top-left tag marking the hero as a match replay (shown whenever a finished match is on screen). */
export function ReplayBadge() {
  const isLive = useIsMatchLive();
  const isReplay = useIsReplay();
  if (isLive && !isReplay) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-overlay/55 px-3 py-1 backdrop-blur-md">
      <ClockCounterClockwise className="size-3.5 text-neon" />
      <span className="font-mono text-eyebrow font-bold tracking-wide text-foreground/90">MATCH REPLAY</span>
    </div>
  );
}
