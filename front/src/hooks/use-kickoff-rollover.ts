'use client';

import { useEffect } from 'react';

import { GameState } from '@/enums/game-state.enum';
import { useMatchStore } from '@/store/match.store';

/** Grace after the scheduled kickoff before we call it live without a wire event. */
const KICKOFF_GRACE_MS = 5_000;

/**
 * Flips a pre-match fixture to in-play the moment its kickoff time passes, so the UI goes live
 * even before the first wire event lands (which would flip it anyway). Mounted with the live
 * feed — one timer per screen, cleaned up when the match switches.
 */
export function useKickoffRollover(): void {
  const fixtureId = useMatchStore((state) =>
    state.match?.gameState === GameState.PreMatch ? state.match.fixtureId : null,
  );
  const startTime = useMatchStore((state) =>
    state.match?.gameState === GameState.PreMatch ? (state.match.startTime ?? null) : null,
  );

  useEffect(() => {
    if (fixtureId == null || startTime == null) return;
    const delay = Math.max(0, startTime - Date.now()) + KICKOFF_GRACE_MS;
    const id = window.setTimeout(() => useMatchStore.getState().markLive(fixtureId), delay);
    return () => window.clearTimeout(id);
  }, [fixtureId, startTime]);
}
