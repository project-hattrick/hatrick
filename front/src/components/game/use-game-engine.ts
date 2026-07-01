'use client';

import { useEffect, useRef } from 'react';
import type { CheckpointId } from '@/game/checkpoints/registry';
import type { EngineHandle, HudPatch } from '@/game/core/types';
import { createEngine } from '@/game/engine';

/** Owns the engine lifecycle for one canvas: create on mount, destroy on unmount (StrictMode-safe). */
export function useGameEngine(checkpoint: CheckpointId, onHud: (patch: HudPatch) => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<EngineHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createEngine(canvas, { checkpoint, onHud });
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, [checkpoint, onHud]);

  return { canvasRef, handleRef };
}
