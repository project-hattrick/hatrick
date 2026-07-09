'use client';

import type { CheckpointId } from '@/game/checkpoints/registry';
import { CANVAS } from '@/game/core/constants';
import { cn } from '@/lib/utils';
import { useSandboxStore } from '@/store/sandbox.store';
import { GameControls } from './game-controls';
import { GameScoreboard } from './game-scoreboard';
import { GoalBurst } from './goal-burst';
import { useGameEngine } from './use-game-engine';

interface GameStageProps {
  checkpoint: CheckpointId;
  /** Box the stage to its positioned parent (absolute) instead of the viewport (fixed) — for framed layouts. */
  contained?: boolean;
  /** Hide the engine's built-in scoreline (when the host renders its own scoreboard). */
  hideScore?: boolean;
}

/** Full-bleed stage: the engine canvas + HUD overlays for one checkpoint. */
export function GameStage({ checkpoint, contained, hideScore }: GameStageProps) {
  const apply = useSandboxStore((s) => s.apply);
  const goalActive = useSandboxStore((s) => s.goalActive);
  const scoreBlue = useSandboxStore((s) => s.scoreBlue);
  const scoreRed = useSandboxStore((s) => s.scoreRed);
  const clock = useSandboxStore((s) => s.clock);
  const { canvasRef, handleRef } = useGameEngine(checkpoint, apply);

  return (
    <div className={cn('inset-0 select-none overflow-hidden bg-[#06222f]', contained ? 'absolute' : 'fixed')}>
      <canvas
        ref={canvasRef}
        width={CANVAS.width}
        height={CANVAS.height}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <GoalBurst active={goalActive} scoreBlue={scoreBlue} scoreRed={scoreRed} clock={clock} />
      {!hideScore && <GameScoreboard />}
      <GameControls handle={handleRef} />
    </div>
  );
}
