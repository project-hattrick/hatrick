'use client';

import { CircleNotch } from '@/components/common/icons';
import { useDisplayMatch, useIsSwitching } from '@/store/match.store';

/**
 * A small, NON-blocking chip shown while a freshly-picked match buffers (the backend replay reloads its
 * history, ~20-30s, before the first event streams). Deliberately does not dim/cover the hero — the pitch
 * keeps playing underneath. Clears on the first event via the store's `switching` flag.
 */
export function MatchSwitchingOverlay() {
  const switching = useIsSwitching();
  const match = useDisplayMatch();
  if (!switching) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-overlay/70 px-4 py-1.5 text-xs font-medium shadow-e2 backdrop-blur-md">
        <CircleNotch className="size-4 animate-spin text-neon" />
        <span className="text-foreground/90">
          Switching to {match.home.code} v {match.away.code} — buffering…
        </span>
      </div>
    </div>
  );
}
