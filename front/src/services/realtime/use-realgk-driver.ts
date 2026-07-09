'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';

import { getSocket } from './socket';
import { driveMatchEvent } from './match-director-map';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEventPayload } from '@/types/match';
import type { RealGkHandle } from '@/game/realgk/types';
import { Team } from '@/game/realgk/enums';
import { useMatchStore } from '@/store/match.store';

/** Wire participant → realgk team (1 = Blue/home, 2 = Red/away). */
const teamOf = (participant?: number): Team | null =>
  participant === 1 ? Team.Blue : participant === 2 ? Team.Red : null;

/**
 * Drives the hero's realgk backdrop from the chosen match's live/replay feed. The engine boots in
 * autonomous "attract mode"; the FIRST real event for the chosen fixture hands the pitch to the feed
 * (`setDriven(true)` → kickoff) so it only starts when there is data. Switching/clearing the match
 * returns it to attract mode. Kept out of React render — the engine runs its own RAF loop.
 */
export function useRealgkDriver(handleRef: MutableRefObject<RealGkHandle | null>): void {
  const fixtureId = useMatchStore((state) => state.match?.fixtureId ?? null);
  const startedRef = useRef(false);

  useEffect(() => {
    // New/absent fixture: back to autonomous attract mode until this match's data arrives.
    startedRef.current = false;
    handleRef.current?.setDriven(false);
    if (fixtureId == null) return;

    const socket = getSocket();
    const onMatch = (p: MatchEventPayload) => {
      if (p.fixtureId !== fixtureId) return;
      const h = handleRef.current;
      if (!h) return;
      if (!startedRef.current) {
        startedRef.current = true;
        h.setDriven(true); // first real event → kick off the feed-driven match
      }
      driveMatchEvent(h, teamOf, p);
    };
    socket.on(`match-event.${EmissionState.During}`, onMatch);
    socket.on(`match-event.${EmissionState.After}`, onMatch);
    return () => {
      socket.off(`match-event.${EmissionState.During}`, onMatch);
      socket.off(`match-event.${EmissionState.After}`, onMatch);
    };
  }, [handleRef, fixtureId]);
}
