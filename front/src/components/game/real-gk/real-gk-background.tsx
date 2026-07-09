'use client';

import { useEffect, useRef } from 'react';
import { createRealGkEngine } from '@/game/realgk/engine';
import { REAL_GK_MATCH_CONFIG } from '@/game/realgk/config';
import type { RealGkConfig } from '@/game/realgk/config';
import type { RealGkHandle } from '@/game/realgk/types';
import { Dimension } from '@/enums/dimension.enum';
import { useUiStore } from '@/store/ui.store';
import { useRealGkStore } from '@/store/real-gk.store';
import { cn } from '@/lib/utils';
import { CrtOverlay } from './crt-overlay';
import { MatchIntroOverlay } from './match-intro-overlay';

const NO_HUD = () => {};

interface RealGkBackgroundProps {
  className?: string;
  bridgeHud?: boolean;
  /** Variant/teams config — defaults to the full-match sim (duels). The hero passes the personas config. */
  config?: RealGkConfig;
  /** Receives the live handle on boot (and null on teardown) so a sibling HUD can drive restart/speed. */
  onReady?: (handle: RealGkHandle | null) => void;
}

/**
 * The Real Match Sim GK runtime as a non-interactive ambient backdrop (no HUD/controls).
 * `bridgeHud` mirrors the engine's HUD patches into the real-gk store so the hero can react to
 * cinematic beats (goal/replay/red card) and show the match-intro overlay; left off, updates are swallowed.
 */
export function RealGkBackground({
  className,
  bridgeHud = false,
  config = REAL_GK_MATCH_CONFIG,
  onReady,
}: RealGkBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<RealGkHandle | null>(null);
  // Engine boots unpaused; this mirrors what we've told it so far (togglePause is a flip, not a set).
  const enginePlayingRef = useRef(true);
  const dimension = useUiStore((state) => state.dimension);
  const playing = useUiStore((state) => state.playing);

  // Match-intro overlay state (pushed by the engine via bridgeHud; stays inert without it).
  const introActive = useRealGkStore((state) => state.introActive);
  const introStage = useRealGkStore((state) => state.introStage);
  const teamBlueName = useRealGkStore((state) => state.teamBlueName);
  const teamRedName = useRealGkStore((state) => state.teamRedName);
  const teamBlueFlag = useRealGkStore((state) => state.teamBlueFlag);
  const teamRedFlag = useRealGkStore((state) => state.teamRedFlag);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onHud = bridgeHud ? useRealGkStore.getState().apply : NO_HUD;
    const handle = createRealGkEngine(canvas, { onHud, config });
    handleRef.current = handle;
    enginePlayingRef.current = true;
    if (!useUiStore.getState().playing) {
      handle.togglePause();
      enginePlayingRef.current = false;
    }
    onReady?.(handle);
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      onReady?.(null);
      handle.destroy();
      handleRef.current = null;
    };
  }, [bridgeHud, config, onReady]);

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
      {config.crtFilter && <CrtOverlay />}
      <MatchIntroOverlay
        active={introActive}
        stage={introStage}
        blueName={teamBlueName}
        redName={teamRedName}
        blueFlag={teamBlueFlag}
        redFlag={teamRedFlag}
      />
    </div>
  );
}
