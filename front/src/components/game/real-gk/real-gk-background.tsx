'use client';

import { useEffect, useRef } from 'react';
import { createRealGkEngine } from '@/game/realgk/engine';
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
  const dimension = useUiStore((state) => state.dimension);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createRealGkEngine(canvas, { onHud: NO_HUD });
    handleRef.current = handle;
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  // The 2D / 2.5D toggle (ui.store) flips the render's perspective without rebooting the engine.
  useEffect(() => {
    handleRef.current?.setFlat(dimension === Dimension.TwoD);
  }, [dimension]);

  return (
    <div ref={containerRef} className={cn('absolute inset-0', className)}>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none h-full w-full" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}
