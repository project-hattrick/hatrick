'use client';

import type { CheckpointId } from '@/game/checkpoints/registry';
import { CANVAS } from '@/game/core/constants';
import { useSandboxStore } from '@/store/sandbox.store';
import { GameControls } from './game-controls';
import { GameScoreboard } from './game-scoreboard';
import { GoalBurst } from './goal-burst';
import { useGameEngine } from './use-game-engine';

/** Full-bleed stage: the engine canvas + HUD overlays for one checkpoint. */
export function GameStage({ checkpoint }: { checkpoint: CheckpointId }) {
  const apply = useSandboxStore((s) => s.apply);
  const goalActive = useSandboxStore((s) => s.goalActive);
  const { canvasRef, handleRef } = useGameEngine(checkpoint, apply);

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#06222f]">
      <canvas
        ref={canvasRef}
        width={CANVAS.width}
        height={CANVAS.height}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <GoalBurst active={goalActive} />
      <GameScoreboard />
      <GameControls handle={handleRef} />
    </div>
  );
}
