'use client';

import { useEffect, useRef } from 'react';
import { createRealGkEngine } from '@/game/realgk/engine';
import { realGkConfigFor, type RealGkConfig } from '@/game/realgk/config';
import type { RealGkHandle } from '@/game/realgk/types';
import { CheckpointId } from '@/game/checkpoints/registry';
import { useRealGkStore } from '@/store/real-gk.store';
import { GoalBurst } from '../goal-burst';
import { CrtOverlay } from './crt-overlay';
import { MatchIntroOverlay } from './match-intro-overlay';
import { RealGkControls } from './real-gk-controls';
import { RealGkHud } from './real-gk-hud';
import { RedCardOverlay } from './red-card-overlay';
import { RestartBanner } from './restart-banner';

/** Scorer's country color (flag palette) for the goal overlay accent; undefined without team brands. */
function goalAccentFor(teams: RealGkConfig['teams'], goalTeam: string): string | undefined {
  if (goalTeam === 'blue') return teams?.blue.colors[0];
  if (goalTeam === 'red') return teams?.red.colors[0];
  return undefined;
}

/** Full-bleed Real Match GK stage: stadium backdrop + engine canvas + HUD/controls. */
export function RealGkStage({ checkpoint = CheckpointId.RealGkV2 }: { checkpoint?: CheckpointId }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<RealGkHandle | null>(null);
  const apply = useRealGkStore((s) => s.apply);
  const goalActive = useRealGkStore((s) => s.goalActive);
  const replayActive = useRealGkStore((s) => s.replayActive);
  const redCardActive = useRealGkStore((s) => s.redCardActive);
  const goalTeam = useRealGkStore((s) => s.goalTeam);
  const introActive = useRealGkStore((s) => s.introActive);
  const introStage = useRealGkStore((s) => s.introStage);
  const restartActive = useRealGkStore((s) => s.restartActive);
  const restartLabel = useRealGkStore((s) => s.restartLabel);
  const restartTeam = useRealGkStore((s) => s.restartTeam);
  const redCardName = useRealGkStore((s) => s.redCardName);
  const teamBlueName = useRealGkStore((s) => s.teamBlueName);
  const teamRedName = useRealGkStore((s) => s.teamRedName);
  const teamBlueFlag = useRealGkStore((s) => s.teamBlueFlag);
  const teamRedFlag = useRealGkStore((s) => s.teamRedFlag);
  const scoreBlue = useRealGkStore((s) => s.scoreBlue);
  const scoreRed = useRealGkStore((s) => s.scoreRed);
  const clock = useRealGkStore((s) => s.clock);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createRealGkEngine(canvas, { onHud: apply, config: realGkConfigFor(checkpoint) });
    handleRef.current = handle;

    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);

    const playable = realGkConfigFor(checkpoint).features?.playable === true;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ') {
        e.preventDefault();
        if (!playable) handle.togglePause(); // in the sandbox, Space passes (handled by the engine)
      } else if (k === 'r') {
        handle.restart();
      } else if (k === 'j') {
        handle.spawnReferee();
      } else if (k === 'g') {
        handle.debugGoal();
      } else if (k === 'l') {
        handle.debugBallDrop();
      } else if (k === 'e') {
        handle.cycleShotEffect();
      } else if (k === 'h') {
        useRealGkStore.getState().toggleUi();
      } else if (k === '1') {
        handle.debugAction('header');
      } else if (k === '2') {
        handle.debugAction('receive');
      } else if (k === '3') {
        handle.debugAction('intercept');
      } else if (k === '4') {
        handle.debugAction('powershot');
      } else if (k === 'i') {
        handle.playIntro();
      } else if (k === 'c') {
        handle.debugRestart('corner');
      } else if (k === 't') {
        handle.debugRestart('throwin');
      } else if (k === 'k') {
        handle.debugRestart('goalkick');
      } else if (k === 'f') {
        handle.debugFoul('free');
      } else if (k === 'p') {
        handle.debugFoul('penalty');
      } else if (k === '5') {
        handle.debugFoul('red');
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
      <GoalBurst
        active={goalActive}
        team={goalTeam}
        blueName={teamBlueName}
        redName={teamRedName}
        scoreBlue={scoreBlue}
        scoreRed={scoreRed}
        clock={clock}
        accent={goalAccentFor(realGkConfigFor(checkpoint).teams, goalTeam)}
      />
      {realGkConfigFor(checkpoint).crtFilter && <CrtOverlay />}
      <RedCardOverlay active={redCardActive} playerName={redCardName} />
      <RestartBanner
        active={restartActive}
        label={restartLabel}
        team={restartTeam}
        teamName={restartTeam === 'blue' ? teamBlueName : restartTeam === 'red' ? teamRedName : ''}
      />
      <MatchIntroOverlay
        active={introActive}
        stage={introStage}
        blueName={teamBlueName}
        redName={teamRedName}
        blueFlag={teamBlueFlag}
        redFlag={teamRedFlag}
      />
      {!replayActive && !introActive && <RealGkHud />}
      {checkpoint === CheckpointId.EffectsLab && (
        <div className="pointer-events-none fixed left-1/2 top-5 z-10 -translate-x-1/2 rounded-md border border-white/15 bg-black/65 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
          Effects Lab · E changes effect · L drops the ball · X shoots
        </div>
      )}
      <RealGkControls handle={handleRef} effectsLab={checkpoint === CheckpointId.EffectsLab} />
    </div>
  );
}
