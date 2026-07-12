'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';

import { getSocket } from './socket';
import { driveMatchEvent, type MatchDirector } from './match-director-map';
import { env } from '@/lib/env';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEventPayload } from '@/types/match';
import type { RealGkHandle } from '@/game/realgk/types';
import { DrivenPhase, Team } from '@/game/realgk/enums';
import { IN_PLAY_STATES, useMatchStore } from '@/store/match.store';

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
  opts?: { cinematicIntro?: boolean; resetKey?: number },
): void {
  const startedRef = useRef(false);
  // Celebration baseline per side. A `goal` feed event fires the on-pitch celebration ONLY when it
  // raises a side's authoritative score — replayed (mid-match join buffer), duplicated (during+after,
  // or the 2× after re-confirm) or VAR-reverted goal events don't move the score, so they must never
  // re-celebrate. The score itself stays authoritative via setScore regardless of this gate.
  const lastHome = useRef(0);
  const lastAway = useRef(0);
  const cinematicIntro = opts?.cinematicIntro === true;
  // Restarting the SAME fixture (replay from kickoff) must also reset the engine — the caller bumps
  // this key so the effect re-runs even though the fixtureId is unchanged.
  const resetKey = opts?.resetKey ?? 0;

  useEffect(() => {
    // New/absent fixture: back to autonomous attract mode until this match's data arrives — or, with
    // the cinematic intro, straight into the held entrance (camera loop) while the feed buffers.
    // typeof guard: an HMR-stale engine handle may predate beginDrivenIntro — fall back to attract.
    startedRef.current = false;
    lastHome.current = 0;
    lastAway.current = 0;
    const handle = handleRef.current;
    // Joining a match that's ALREADY in play (mid-game): the walk-on entrance only makes sense from
    // pre-match — skip it and drop straight into live play (a center kickoff the feed takes over on its
    // first event). A pre-match / not-yet-live fixture still gets the held cinematic entrance.
    const joinInPlay =
      fixtureId != null &&
      !env.useMock &&
      (() => {
        const { match } = useMatchStore.getState();
        return !!match && match.fixtureId === fixtureId && IN_PLAY_STATES.has(match.gameState);
      })();
    if (fixtureId != null && joinInPlay) {
      const { match } = useMatchStore.getState();
      handle?.setDriven(true); // straight to live — no entrance
      startedRef.current = true;
      lastHome.current = match?.score.home ?? 0;
      lastAway.current = match?.score.away ?? 0;
    } else if (fixtureId != null && cinematicIntro && typeof handle?.beginDrivenIntro === 'function') {
      handle.beginDrivenIntro();
    } else {
      handle?.setDriven(false);
    }
    if (fixtureId == null) return;

    // A live match must not wait for a wire event to leave the held entrance: if the STORE already says
    // this fixture is in play (mid-game join via snapshot, or the kickoff rollover), release the pitch
    // now and keep its scoreboard/clock synced. Wire events still drive the actual play when they flow.
    // Mock mode keeps the autonomous attract match (its events go through the store, not the socket).
    const syncFromStore = () => {
      if (env.useMock) return;
      const { match } = useMatchStore.getState();
      if (!match || match.fixtureId !== fixtureId || !IN_PLAY_STATES.has(match.gameState)) return;
      const h = handleRef.current;
      if (!h) return;
      if (!startedRef.current) {
        startedRef.current = true;
        h.setDriven(true); // releases the intro hold (whistle → kickoff → Live)
        // Adopt the join-time score as the celebration baseline — goals scored before we joined
        // (or that get re-sent from the feed buffer) must not replay a celebration.
        lastHome.current = match.score.home;
        lastAway.current = match.score.away;
      }
      if (typeof h.setScore === 'function') h.setScore(match.score.home, match.score.away);
      if (typeof h.setClock === 'function') h.setClock(match.minute);
    };
    syncFromStore();
    const unsubscribeStore = useMatchStore.subscribe(syncFromStore);

    // Wrap the engine so a `goal` directive only celebrates on a REAL score increase (see lastHome/
    // lastAway). setScore stays authoritative; injectGoal is gated. Built per event so setScore and
    // injectGoal within the same event share the fresh score.
    const driveGuarded = (h: RealGkHandle, p: MatchEventPayload) => {
      let curHome = lastHome.current;
      let curAway = lastAway.current;
      const director: MatchDirector<Team> = {
        setScore: (home, away) => {
          curHome = home;
          curAway = away;
          // VAR/overturn: an authoritative drop lowers the baseline so a legit re-score can celebrate again.
          if (home < lastHome.current) lastHome.current = home;
          if (away < lastAway.current) lastAway.current = away;
          h.setScore(home, away);
        },
        setPossession: (team, threat) => h.setPossession(team, threat),
        injectShot: (team, outcome) => h.injectShot(team, outcome),
        injectGoal: (team) => {
          const isRed = team === Team.Red;
          const cur = isRed ? curAway : curHome;
          const base = isRed ? lastAway : lastHome;
          if (cur > base.current) {
            base.current = cur;
            h.injectGoal(team);
          }
          // else: the score didn't move → stale / duplicate / reverted goal event, no celebration.
        },
        injectCorner: (team) => h.injectCorner(team),
        injectCard: (team, red) => h.injectCard(team, red),
        injectPenalty: (team) => h.injectPenalty(team),
        injectFreeKick: (team, danger) => h.injectFreeKick(team, danger),
        setClock: (minute) => h.setClock(minute),
        setPhase: (phase) => h.setPhase(phase),
      };
      driveMatchEvent(director, teamOf, p);
    };

    const socket = getSocket();
    const onMatch = (p: MatchEventPayload) => {
      if (p.fixtureId !== fixtureId) return;
      const h = handleRef.current;
      if (!h) return;
      if (!startedRef.current) {
        startedRef.current = true;
        h.setDriven(true); // first real event → kick off the feed-driven match
        const snap = useMatchStore.getState().match;
        lastHome.current = snap?.score.home ?? 0;
        lastAway.current = snap?.score.away ?? 0;
      }
      driveGuarded(h, p);
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
      unsubscribeStore();
      socket.off(`match-event.${EmissionState.During}`, onMatch);
      socket.off(`match-event.${EmissionState.After}`, onMatch);
      socket.off(CH_MATCH_END, onEnd);
    };
  }, [handleRef, fixtureId, cinematicIntro, resetKey]);
}

/** The hero variant: drives the backdrop from the globally chosen match (match.store). */
export function useRealgkDriver(handleRef: MutableRefObject<RealGkHandle | null>): void {
  const fixtureId = useMatchStore((state) => state.match?.fixtureId ?? null);
  const replayNonce = useMatchStore((state) => state.replayNonce);
  useRealgkFeedDriver(handleRef, fixtureId, { cinematicIntro: true, resetKey: replayNonce });
}
