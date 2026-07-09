'use client';

import { useEffect, type MutableRefObject } from 'react';

import { getSocket } from './socket';
import { driveMatchEvent } from './match-director-map';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEventPayload } from '@/types/match';
import type { HeadsOnlyHandle } from '@/game/headsonly/engine';
import { Team } from '@/game/headsonly/types';
import { DrivenPhase } from '@/game/realgk/enums';

/** Authoritative end-of-match channel (same one use-match-feed listens on). */
const CH_MATCH_END = 'match-end.after';

/** Wire participant → headsonly team (1 = Blue/home, 2 = Red/away). */
const teamOf = (participant?: number): Team | null =>
  participant === 1 ? Team.Blue : participant === 2 ? Team.Red : null;

/**
 * Subscribes to the realtime feed and drives the heads engine imperatively
 * (kept out of React render — the engine runs its own RAF loop).
 */
export function useHeadsDriver(handleRef: MutableRefObject<HeadsOnlyHandle | null>, fixtureId: number | null): void {
  useEffect(() => {
    const socket = getSocket();
    const onMatch = (p: MatchEventPayload) => {
      if (fixtureId == null || p.fixtureId !== fixtureId) return;
      const h = handleRef.current;
      if (h) driveMatchEvent(h, teamOf, p);
    };
    // FT backstop: the normalizer always emits match-end once per fixture (setPhase is idempotent).
    const onEnd = (p: { fixtureId: number }) => {
      if (fixtureId == null || p.fixtureId !== fixtureId) return;
      const h = handleRef.current;
      if (typeof h?.setPhase === 'function') h.setPhase(DrivenPhase.FullTime);
    };
    socket.on(`match-event.${EmissionState.During}`, onMatch);
    socket.on(`match-event.${EmissionState.After}`, onMatch);
    socket.on(CH_MATCH_END, onEnd);
    return () => {
      socket.off(`match-event.${EmissionState.During}`, onMatch);
      socket.off(`match-event.${EmissionState.After}`, onMatch);
      socket.off(CH_MATCH_END, onEnd);
    };
  }, [handleRef, fixtureId]);
}
