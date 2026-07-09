'use client';

import { useEffect, useRef } from 'react';

import { useRealGkStore } from '@/store/real-gk.store';
import { useDuelStore } from '@/store/duel.store';
import { DuelResult } from '@/enums/duel-result.enum';

/** How long a duel runs (real time) before it settles. The engine plays continuously; this bounds it. */
const DUEL_DURATION_MS = 90_000;

/** Score → result from the signed-in player's POV (blue = self, red = opponent). */
const resultFor = (self: number, opp: number): DuelResult =>
  self > opp ? DuelResult.Win : self < opp ? DuelResult.Loss : DuelResult.Draw;

/**
 * Bridges the always-on real-GK engine into the duel: the arena's scoreline is the engine's goals
 * counted FROM this duel's kickoff (a baseline delta, since the ambient sim never resets), and after a
 * fixed match window it settles the result (→ `finish` → backend settle + result dialog). Mounted once
 * in DuelDashboard.
 */
export function useDuelSync(): void {
  const inSetup = useDuelStore((s) => s.inSetup);
  const finished = useDuelStore((s) => s.finished);
  const duelId = useDuelStore((s) => s.duelId);
  // Engine score at kickoff — the duel counts goals scored after this point.
  const baseline = useRef<{ blue: number; red: number } | null>(null);

  // Live score = engine goals since the duel kicked off (blue = self, red = opponent).
  useEffect(() => {
    const unsub = useRealGkStore.subscribe((s, prev) => {
      if (s.scoreBlue === prev.scoreBlue && s.scoreRed === prev.scoreRed) return;
      const base = baseline.current;
      if (!base) return;
      useDuelStore.getState().setScore(Math.max(0, s.scoreBlue - base.blue), Math.max(0, s.scoreRed - base.red));
    });
    return unsub;
  }, []);

  // Kickoff: capture the baseline + zero the scoreline, then run the match clock and settle at full time.
  useEffect(() => {
    if (inSetup || finished || !duelId) {
      baseline.current = null;
      return;
    }
    const gk = useRealGkStore.getState();
    baseline.current = { blue: gk.scoreBlue, red: gk.scoreRed };
    useDuelStore.getState().setScore(0, 0);
    const id = window.setTimeout(() => {
      const { selfScore, opponentScore, finish } = useDuelStore.getState();
      finish(resultFor(selfScore, opponentScore));
    }, DUEL_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [inSetup, finished, duelId]);
}
