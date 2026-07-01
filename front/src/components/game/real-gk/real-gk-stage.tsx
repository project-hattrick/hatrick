'use client';

import { useEffect, useRef } from 'react';
import { createRealGkEngine } from '@/game/realgk/engine';
import { realGkConfigFor } from '@/game/realgk/config';
import type { RealGkHandle } from '@/game/realgk/types';
import { CheckpointId } from '@/game/checkpoints/registry';
import { useRealGkStore } from '@/store/real-gk.store';
import { GoalBurst } from '../goal-burst';
import { RealGkControls } from './real-gk-controls';
import { RealGkHud } from './real-gk-hud';

/** Full-bleed Real Match GK stage: stadium backdrop + engine canvas + HUD/controls. */
export function RealGkStage({ checkpoint = CheckpointId.RealGkV2 }: { checkpoint?: CheckpointId }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<RealGkHandle | null>(null);
  const apply = useRealGkStore((s) => s.apply);
  const goalActive = useRealGkStore((s) => s.goalActive);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createRealGkEngine(canvas, { onHud: apply, config: realGkConfigFor(checkpoint) });
    handleRef.current = handle;

    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ') {
        e.preventDefault();
        handle.togglePause();
      } else if (k === 'r') {
        handle.restart();
      } else if (k === 'j') {
        handle.spawnReferee();
      } else if (k === 'h') {
        useRealGkStore.getState().toggleUi();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, [apply, checkpoint]);

  return (
    <div ref={containerRef} className="fixed inset-0 select-none overflow-hidden bg-[#06222f]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />
      <GoalBurst active={goalActive} />
      <RealGkHud />
      <RealGkControls handle={handleRef} />
    </div>
  );
}
