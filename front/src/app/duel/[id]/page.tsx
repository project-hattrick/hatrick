'use client';

import { DuelArena } from '@/components/duel/duel-arena';
import { DuelResultDialog } from '@/components/duel/duel-result-dialog';
import { Button } from '@/components/ui/button';
import { DuelResult } from '@/enums/duel-result.enum';
import { useDuelStore } from '@/store/duel.store';
import { useSandboxStore } from '@/store/sandbox.store';

/**
 * 1v1 Duel Arena page — full-bleed, engine-driven.
 *
 * Score wiring:
 * - The engine pushes HudPatch { scoreBlue, scoreRed } into useSandboxStore via GameStage.
 * - "End Match" reads those values, maps self=Blue / opponent=Red, mirrors into duel.store,
 *   and computes the DuelResult before calling finish().
 *
 * Direct-visit safety: DuelArena renders a graceful fallback when opponent is null.
 * Metadata lives in the sibling layout.tsx (server component, noindex).
 */
export default function DuelPage() {
  const finished = useDuelStore((s) => s.finished);
  const finish = useDuelStore((s) => s.finish);
  const setScore = useDuelStore((s) => s.setScore);

  // Read the live engine score from the sandbox store (populated by GameStage → useGameEngine).
  const scoreBlue = useSandboxStore((s) => s.scoreBlue);
  const scoreRed = useSandboxStore((s) => s.scoreRed);

  function handleEndMatch() {
    // Mirror engine scoreline (self = Blue team, opponent = Red team convention).
    setScore(scoreBlue, scoreRed);

    const result: DuelResult =
      scoreBlue > scoreRed
        ? DuelResult.Win
        : scoreBlue < scoreRed
          ? DuelResult.Loss
          : DuelResult.Draw;

    finish(result);
  }

  return (
    <>
      {/* Full-bleed engine + identity overlay; renders a fallback when no opponent is set. */}
      <DuelArena />

      {/* Portal dialog — controlled by duel.store.finished. */}
      <DuelResultDialog />

      {/* Floating "End Match" button — hidden once the result dialog is shown. */}
      {!finished && (
        <Button
          variant="outline"
          shape="pill"
          className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 shadow-lg"
          onClick={handleEndMatch}
        >
          End Match
        </Button>
      )}
    </>
  );
}
