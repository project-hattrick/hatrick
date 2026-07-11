'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Camera, Lightning, Pause, Play, SoccerBall } from '@/components/common/icons';
import { GoalBurst } from '@/components/game/goal-burst';
import { RestartBanner } from '@/components/game/real-gk/restart-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FRANCE_COMPLETE_SIZE_VARIANTS, type FranceSizeVariantId } from '@/game/realgk/config';
import { createRealGkEngine } from '@/game/realgk/engine';
import type { RealGkHandle } from '@/game/realgk/types';
import { useRealGkStore } from '@/store/real-gk.store';

const isVariantId = (v: string | null): v is FranceSizeVariantId => v !== null && v in FRANCE_COMPLETE_SIZE_VARIANTS;

export function FranceCompleteArena() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<RealGkHandle | null>(null);
  const sizeParam = useSearchParams().get('size');
  const [variant, setVariant] = useState<FranceSizeVariantId>(isVariantId(sizeParam) ? sizeParam : 'a');

  const scoreBlue = useRealGkStore((s) => s.scoreBlue);
  const scoreRed = useRealGkStore((s) => s.scoreRed);
  const clock = useRealGkStore((s) => s.clock);
  const paused = useRealGkStore((s) => s.paused);
  const speed = useRealGkStore((s) => s.speed);
  const cameraLabel = useRealGkStore((s) => s.cameraLabel);
  const ballText = useRealGkStore((s) => s.ballText);
  const goalActive = useRealGkStore((s) => s.goalActive);
  const goalTeam = useRealGkStore((s) => s.goalTeam);
  const restartActive = useRealGkStore((s) => s.restartActive);
  const restartLabel = useRealGkStore((s) => s.restartLabel);
  const restartTeam = useRealGkStore((s) => s.restartTeam);

  // Recreating the engine on a size switch restarts the match — acceptable for the sandbox comparison.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createRealGkEngine(canvas, { onHud: useRealGkStore.getState().apply, config: FRANCE_COMPLETE_SIZE_VARIANTS[variant].config });
    handleRef.current = handle;
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, [variant]);

  return (
    <div ref={containerRef} className="fixed inset-0 select-none overflow-hidden bg-[#06222f]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />

      <GoalBurst
        active={goalActive}
        team={goalTeam}
        blueName="France Blue"
        redName="France Red"
        scoreBlue={scoreBlue}
        scoreRed={scoreRed}
        clock={clock}
        accent={goalTeam === 'red' ? '#EF4135' : '#0055A4'}
      />
      <RestartBanner active={restartActive} label={restartLabel} team={restartTeam} teamName={restartTeam === 'red' ? 'France Red' : 'France Blue'} />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-white/10 bg-black/55 px-5 py-2 backdrop-blur">
          <span className="max-w-[28vw] truncate text-right text-sm font-semibold text-[#7aa2ff]">France Blue</span>
          <span className="font-mono text-2xl font-bold tabular-nums text-white">
            {scoreBlue}<span className="mx-1 text-white/40">-</span>{scoreRed}
          </span>
          <span className="max-w-[28vw] truncate text-left text-sm font-semibold text-[#ff6b6b]">France Red</span>
          <span className="ml-2 border-l border-white/15 pl-3 font-mono text-xs text-white/70">{clock}</span>
        </div>
        <Badge variant="outline" className="pointer-events-auto border-white/15 bg-black/45 text-white/80">
          <SoccerBall className="mr-1 size-3.5" /> {ballText}
        </Badge>
      </div>

      <div className="absolute right-3 top-3 flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center overflow-hidden rounded-md border border-white/15 bg-black/45">
          {(Object.keys(FRANCE_COMPLETE_SIZE_VARIANTS) as FranceSizeVariantId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setVariant(id)}
              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                variant === id ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {FRANCE_COMPLETE_SIZE_VARIANTS[id].label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.togglePause()}>
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          {paused ? 'Play' : 'Pause'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.cycleCamera()}>
          <Camera className="size-4" />
          {cameraLabel.replace('Cam: ', '')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.cycleSpeed()}>
          <Lightning className="size-4" />
          {speed}x
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.restart()}>
          Restart
        </Button>
      </div>
    </div>
  );
}
