'use client';

import { useCallback, useRef } from 'react';

import { REAL_GK_MATCH_CONFIG } from '@/game/realgk/config';
import type { RealGkHandle } from '@/game/realgk/types';
import { useRealgkDriver } from '@/services/realtime/use-realgk-driver';
import { useHeroEngineStore, type HeroEngineControls } from '@/store/hero-engine.store';
import { RealGkBackground } from './real-gk-background';

/**
 * The hero backdrop. It boots the ambient full-match sim ONCE with a stable config and NEVER
 * recreates — recreating the (co-edited, WIP) engine on every match switch flooded recovered draw
 * errors. Instead the picked match's live/replay feed drives the on-pitch action imperatively via
 * `useRealgkDriver` (feed director): the sim runs in autonomous attract mode until the chosen match has
 * data, then hands the pitch to the feed so goals/shots/corners/cards mirror the real match 1:1.
 */
export function PersonaHeroBackdrop({ bridgeHud = false, className }: { bridgeHud?: boolean; className?: string }) {
  const setControls = useHeroEngineStore((state) => state.setControls);
  const handleRef = useRef<RealGkHandle | null>(null);

  const onReady = useCallback(
    (handle: RealGkHandle | null) => {
      handleRef.current = handle;
      const controls: HeroEngineControls | null = handle
        ? { restart: () => handle.restart(), cycleSpeed: () => handle.cycleSpeed() }
        : null;
      setControls(controls);
    },
    [setControls],
  );

  // Bridge the chosen match's events into the engine (imperative; kept out of the boot-once render).
  useRealgkDriver(handleRef);

  return (
    <RealGkBackground config={REAL_GK_MATCH_CONFIG} bridgeHud={bridgeHud} onReady={onReady} className={className} />
  );
}
