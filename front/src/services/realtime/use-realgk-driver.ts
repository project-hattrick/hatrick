'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';

import { getSocket } from './socket';
import { driveMatchEvent } from './match-director-map';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEventPayload } from '@/types/match';
import type { RealGkHandle } from '@/game/realgk/types';
import { DrivenPhase, Team } from '@/game/realgk/enums';
import { useMatchStore } from '@/store/match.store';

/** Authoritative end-of-match channel (same one use-match-feed listens on). */
const CH_MATCH_END = 'match-end.after';

/** Wire participant → realgk team (1 = Blue/home, 2 = Red/away). */
const teamOf = (participant?: number): Team | null =>
  participant === 1 ? Team.Blue : participant === 2 ? Team.Red : null;

/**
 * Drives a realgk engine from an explicit fixture's live/replay feed. The engine boots in autonomous
 * "attract mode"; the FIRST real event for the fixture hands the pitch to the feed (`setDriven(true)` →
 * kickoff) so it only starts when there is data. Switching/clearing the fixture returns it to attract
 * mode. Kept out of React render — the engine runs its own RAF loop.
 */
export function useRealgkFeedDriver(
  handleRef: MutableRefObject<RealGkHandle | null>,
  fixtureId: number | null,
  opts?: { cinematicIntro?: boolean },
): void {
  const startedRef = useRef(false);
  const cinematicIntro = opts?.cinematicIntro === true;

  useEffect(() => {
    // New/absent fixture: back to autonomous attract mode until this match's data arrives — or, with
    // the cinematic intro, straight into the held entrance (camera loop) while the feed buffers.
    // typeof guard: an HMR-stale engine handle may predate beginDrivenIntro — fall back to attract.
    startedRef.current = false;
    const handle = handleRef.current;
    if (fixtureId != null && cinematicIntro && typeof handle?.beginDrivenIntro === 'function') handle.beginDrivenIntro();
    else handle?.setDriven(false);
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
    // FT backstop: replays that started mid-match may never carry a `game_finalised` raw action, but the
    // normalizer always emits match-end once per fixture. setPhase is idempotent (and HMR-stale safe).
    const onEnd = (p: { fixtureId: number }) => {
      if (p.fixtureId !== fixtureId) return;
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
  }, [handleRef, fixtureId, cinematicIntro]);
}

/** The hero variant: drives the backdrop from the globally chosen match (match.store). */
export function useRealgkDriver(handleRef: MutableRefObject<RealGkHandle | null>): void {
  const fixtureId = useMatchStore((state) => state.match?.fixtureId ?? null);
  useRealgkFeedDriver(handleRef, fixtureId);
}
