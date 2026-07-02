'use client';

import { useEffect, useRef } from 'react';
import { createRealGkEngine } from '@/game/realgk/engine';
import { REAL_GK_HERO_CONFIG } from '@/game/realgk/config';
import type { RealGkHandle } from '@/game/realgk/types';
import { Dimension } from '@/enums/dimension.enum';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

const NO_HUD = () => {};

/** The Real Match Sim GK runtime as a non-interactive ambient backdrop (no HUD/controls). */
export function RealGkBackground({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<RealGkHandle | null>(null);
  // Engine boots unpaused; this mirrors what we've told it so far (togglePause is a flip, not a set).
  const enginePlayingRef = useRef(true);
  const dimension = useUiStore((state) => state.dimension);
  const playing = useUiStore((state) => state.playing);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createRealGkEngine(canvas, { onHud: NO_HUD, config: REAL_GK_HERO_CONFIG });
    handleRef.current = handle;
    enginePlayingRef.current = true;
    if (!useUiStore.getState().playing) {
      handle.togglePause();
      enginePlayingRef.current = false;
    }
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  // Play/Pause button (ui.store) drives the sim loop.
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || enginePlayingRef.current === playing) return;
    handle.togglePause();
    enginePlayingRef.current = playing;
  }, [playing]);

  // The 2D / 2.5D toggle (ui.store) flips the render's perspective without rebooting the engine.
  useEffect(() => {
    handleRef.current?.setFlat(dimension === Dimension.TwoD);
  }, [dimension]);

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div
        ref={containerRef}
        className="absolute top-1/2 left-1/2 h-full w-[max(100%,177.78svh)] -translate-x-1/2 -translate-y-1/2 md:top-0 md:left-0 md:h-full md:w-full md:translate-x-0 md:translate-y-0"
      >
        <canvas ref={canvasRef} aria-hidden className="pointer-events-none h-full w-full" style={{ imageRendering: 'pixelated' }} />
      </div>
    </div>
  );
}
