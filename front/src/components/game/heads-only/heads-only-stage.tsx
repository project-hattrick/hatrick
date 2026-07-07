'use client';

import { useEffect, useRef } from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import { Keyboard, Pause } from '@/components/common/icons';
import { createHeadsOnlyEngine, type HeadsOnlyHandle } from '@/game/headsonly/engine';

const controlClass =
  'inline-flex h-9 items-center gap-1.5 rounded-md border border-border/60 bg-surface-1/80 px-3 text-xs font-bold uppercase tracking-wide transition hover:bg-surface-2 active:translate-y-px';

/** Full-bleed head-only sandbox: top-view mini pitch + four-direction head sprites. */
export function HeadsOnlyStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<HeadsOnlyHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createHeadsOnlyEngine(canvas);
    handleRef.current = handle;

    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 select-none overflow-hidden bg-[#03121a]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />
      <GlassPanel
        radius="pill"
        className="pointer-events-auto fixed inset-x-0 bottom-3.5 z-10 mx-auto flex w-fit max-w-[96vw] flex-wrap items-center justify-center gap-2 p-2"
      >
        <span className="hidden items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline-flex">
          <Keyboard className="size-3.5" />
          WASD move · Space pass · X shoot · Click aims the ball
        </span>
        <button type="button" className={controlClass} onClick={() => handleRef.current?.togglePause()}>
          <Pause className="size-3.5" />
          Pause
        </button>
        <button type="button" className={controlClass} onClick={() => handleRef.current?.restart()}>
          Restart
        </button>
      </GlassPanel>
    </div>
  );
}
