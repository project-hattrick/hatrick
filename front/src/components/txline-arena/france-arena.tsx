'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Camera, Lightning, Pause, Play, SoccerBall, Target } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { REAL_GK_FRANCE_PLAY_CONFIG } from '@/game/realgk/config';
import { createRealGkEngine } from '@/game/realgk/engine';
import type { RealGkHandle } from '@/game/realgk/types';
import { useRealGkStore } from '@/store/real-gk.store';

interface FranceArenaProps {
  /** Pin keyboard control to the keeper (full manual GK: move, Q/E dives, throws, punts). */
  keeperControl?: boolean;
}

export function FranceArena({ keeperControl = false }: FranceArenaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<RealGkHandle | null>(null);
  const [controlLabel, setControlLabel] = useState(keeperControl ? 'Control: Goalkeeper' : 'Control: Player');

  const scoreBlue = useRealGkStore((s) => s.scoreBlue);
  const scoreRed = useRealGkStore((s) => s.scoreRed);
  const clock = useRealGkStore((s) => s.clock);
  const paused = useRealGkStore((s) => s.paused);
  const speed = useRealGkStore((s) => s.speed);
  const cameraLabel = useRealGkStore((s) => s.cameraLabel);
  const targetLabel = useRealGkStore((s) => s.targetLabel);
  const ballText = useRealGkStore((s) => s.ballText);

  const config = useMemo(
    () => (keeperControl ? { ...REAL_GK_FRANCE_PLAY_CONFIG, keeperControl: true } : REAL_GK_FRANCE_PLAY_CONFIG),
    [keeperControl],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createRealGkEngine(canvas, { onHud: useRealGkStore.getState().apply, config });
    handleRef.current = handle;
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, [config]);

  return (
    <div ref={containerRef} className="fixed inset-0 select-none overflow-hidden bg-[#06222f]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-white/10 bg-black/55 px-5 py-2 backdrop-blur">
          <span className="max-w-[28vw] truncate text-right text-sm font-semibold text-[#5f8fff]">France</span>
          <span className="font-mono text-2xl font-bold tabular-nums text-white">
            {scoreBlue}<span className="mx-1 text-white/40">-</span>{scoreRed}
          </span>
          <span className="max-w-[28vw] truncate text-left text-sm font-semibold text-[#ef4135]">France</span>
          <span className="ml-2 border-l border-white/15 pl-3 font-mono text-xs text-white/70">{clock}</span>
        </div>
        <Badge variant="outline" className="pointer-events-auto border-white/15 bg-black/45 text-white/80">
          <SoccerBall className="mr-1 size-3.5" /> {ballText}
        </Badge>
        {keeperControl ? (
          <Badge variant="outline" className="pointer-events-auto border-[#5f8fff]/40 bg-black/45 text-[#9db9ff]">
            GK CONTROL — WASD move · Q/E dive · Space throw · X punt · C header · V trap · B intercept · F slide
          </Badge>
        ) : null}
      </div>

      <div className="absolute right-3 top-3 flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.togglePause()}>
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          {paused ? 'Play' : 'Pause'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.cycleCamera()}>
          <Camera className="size-4" />
          {cameraLabel.replace('Cam: ', '')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.cycleTarget()}>
          <Target className="size-4" />
          {targetLabel.replace('Follow: ', '')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const next = handleRef.current?.cycleControlledPlayer();
            if (next) setControlLabel(next);
          }}
        >
          <Target className="size-4" />
          {controlLabel.replace('Control: ', '')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.cycleSpeed()}>
          <Lightning className="size-4" />
          {speed}x
        </Button>
      </div>

      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            handleRef.current?.restart();
            setControlLabel(keeperControl ? 'Control: Goalkeeper' : 'Control: Player');
          }}
        >
          Restart
        </Button>
        {keeperControl ? (
          <>
            <Button size="sm" variant="outline" onClick={() => handleRef.current?.keeperDive(-1)}>
              Dive up
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleRef.current?.keeperDive(1)}>
              Dive down
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleRef.current?.debugIncomingShot()}>
              Shot at you
            </Button>
          </>
        ) : null}
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.debugAction('receive')}>
          Receive
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.debugAction('powershot')}>
          Power shot
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.debugGoal()}>
          Goal
        </Button>
      </div>
    </div>
  );
}
