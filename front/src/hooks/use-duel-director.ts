'use client';

import { useEffect } from 'react';

import {
  DUEL_FULLTIME_HOLD_SECONDS,
  DUEL_HALF_MATCH_MINUTES,
  DUEL_HALFTIME_REAL_SECONDS,
  DUEL_HALF_REAL_SECONDS,
  DUEL_TICK_MS,
  OPPONENT_DECK,
} from '@/config/duel-match.config';
import { userCards } from '@/config/fantasy-cards.config';
import { DuelPhase } from '@/enums/duel-phase.enum';
import { DuelResult } from '@/enums/duel-result.enum';
import { DrivenPhase, Team } from '@/game/realgk/enums';
import type { RealGkHandle } from '@/game/realgk/types';
import {
  ChanceOutcome,
  DuelSimTeam,
  fromCollectionCard,
  fromPlayerCardData,
  seedFromString,
  simulateDuel,
  type DuelChanceEvent,
  type SimCard,
} from '@/lib/duel-sim';
import { useDuelStore } from '@/store/duel.store';
import { useFantasyStore } from '@/store/fantasy.store';

/** Score → result from the signed-in player's POV (home = self, away = opponent). */
const resultFor = (self: number, opp: number): DuelResult =>
  self > opp ? DuelResult.Win : self < opp ? DuelResult.Loss : DuelResult.Draw;

/** The fielded squad as simulator cards (same fallback chain as use-self-deck). */
function selfSimCards(): SimCard[] {
  const { squad, collection } = useFantasyStore.getState();
  const owned = squad.map((i) => collection[i]).filter(Boolean);
  if (owned.length) return owned.map(fromCollectionCard);
  if (collection.length) return collection.slice(0, 11).map(fromCollectionCard);
  return userCards.map(fromPlayerCardData);
}

const engineTeam = (team: DuelSimTeam): Team => (team === DuelSimTeam.Home ? Team.Blue : Team.Red);
const opposite = (team: Team): Team => (team === Team.Blue ? Team.Red : Team.Blue);

/**
 * Runs the duel as a DIRECTED match: the chance-battle simulator pre-rolls 90' from the two squads'
 * card attributes (attributes ARE the dispute), and this director replays its beats over ~5 real
 * minutes through the engine's feed API (inject/setScore/setPhase — the same surface the TxLINE
 * arenas use). The engine only dramatizes; the simulator's score is authoritative. At full time it
 * settles via `finish` → backend settle + result dialog. Mounted once in DuelDashboard.
 */
export function useDuelDirector(handle: RealGkHandle | null): void {
  const inSetup = useDuelStore((s) => s.inSetup);
  const finished = useDuelStore((s) => s.finished);
  const duelId = useDuelStore((s) => s.duelId);

  useEffect(() => {
    if (inSetup || finished || !duelId || !handle) return;

    // Same duel id → same match (rematches roll a new id via the route).
    const timeline = simulateDuel(selfSimCards(), OPPONENT_DECK.map(fromPlayerCardData), seedFromString(duelId));
    handle.setDriven(true);
    useDuelStore.getState().setScore(0, 0);
    useDuelStore.getState().setMatchClock(0, DuelPhase.FirstHalf);

    let eventIdx = 0;
    let home = 0;
    let away = 0;
    let sentHalfTime = false;
    let sentSecondHalf = false;
    let sentFullTime = false;
    let settleId: number | null = null;
    const startedAt = performance.now();

    const dispatch = (e: DuelChanceEvent): void => {
      const team = engineTeam(e.team);
      if (e.outcome === ChanceOutcome.Goal) {
        if (e.team === DuelSimTeam.Home) home += 1;
        else away += 1;
        handle.setScore(home, away);
        handle.injectGoal(team);
        useDuelStore.getState().setScore(home, away);
      } else if (e.outcome === ChanceOutcome.SavedShot || e.outcome === ChanceOutcome.OffTargetShot) {
        handle.setPossession(team, 0.85);
        handle.injectShot(team);
      } else if (e.outcome === ChanceOutcome.Corner) {
        handle.injectCorner(team);
      } else {
        handle.setPossession(opposite(team), 0.5); // steal — the defense wins the ball
      }
    };

    const tick = (): void => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const half = DUEL_HALF_REAL_SECONDS;
      let minute: number;
      let phase: DuelPhase;
      if (elapsed < half) {
        minute = (DUEL_HALF_MATCH_MINUTES * elapsed) / half;
        phase = DuelPhase.FirstHalf;
      } else if (elapsed < half + DUEL_HALFTIME_REAL_SECONDS) {
        minute = DUEL_HALF_MATCH_MINUTES;
        phase = DuelPhase.HalfTime;
        if (!sentHalfTime) {
          sentHalfTime = true;
          handle.setPhase(DrivenPhase.HalfTime);
        }
      } else if (elapsed < half * 2 + DUEL_HALFTIME_REAL_SECONDS) {
        minute = DUEL_HALF_MATCH_MINUTES + (DUEL_HALF_MATCH_MINUTES * (elapsed - half - DUEL_HALFTIME_REAL_SECONDS)) / half;
        phase = DuelPhase.SecondHalf;
        if (!sentSecondHalf) {
          sentSecondHalf = true;
          handle.setPhase(DrivenPhase.Kickoff);
        }
      } else {
        minute = DUEL_HALF_MATCH_MINUTES * 2;
        phase = DuelPhase.FullTime;
        if (!sentFullTime) {
          sentFullTime = true;
          handle.setPhase(DrivenPhase.FullTime);
          // Let the whistle + celebration beat land before the result dialog takes over.
          settleId = window.setTimeout(() => {
            const s = useDuelStore.getState();
            s.finish(resultFor(s.selfScore, s.opponentScore));
          }, DUEL_FULLTIME_HOLD_SECONDS * 1000);
        }
      }
      const m = Math.min(DUEL_HALF_MATCH_MINUTES * 2, Math.floor(minute));
      handle.setClock(m);
      useDuelStore.getState().setMatchClock(m, phase);
      // Beats only play while a half runs (a due beat never interrupts the interval walk-off).
      if (phase === DuelPhase.FirstHalf || phase === DuelPhase.SecondHalf) {
        while (eventIdx < timeline.events.length && timeline.events[eventIdx].simMinute <= m) {
          dispatch(timeline.events[eventIdx]);
          eventIdx += 1;
        }
      }
    };

    const id = window.setInterval(tick, DUEL_TICK_MS);
    tick();
    return () => {
      window.clearInterval(id);
      if (settleId !== null) window.clearTimeout(settleId);
    };
  }, [inSetup, finished, duelId, handle]);
}
