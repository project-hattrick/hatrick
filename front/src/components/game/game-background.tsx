'use client';

import type { CheckpointId } from '@/game/checkpoints/registry';
import { CANVAS } from '@/game/core/constants';
import { cn } from '@/lib/utils';
import { useGameEngine } from './use-game-engine';

/** HUD updates are irrelevant for a backdrop, so swallow them (stable identity for the effect dep). */
const NO_HUD = () => {};

/** A live checkpoint rendered as a non-interactive backdrop (no scoreboard / controls). */
export function GameBackground({ checkpoint, className }: { checkpoint: CheckpointId; className?: string }) {
  const { canvasRef } = useGameEngine(checkpoint, NO_HUD);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS.width}
      height={CANVAS.height}
      aria-hidden
      className={cn('pointer-events-none h-full w-full object-cover', className)}
    />
  );
}
