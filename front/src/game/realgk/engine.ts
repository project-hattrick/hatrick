import { MAX_DT } from './constants';
import { REAL_GK_V2_CONFIG, type RealGkConfig } from './config';
import { loadRealGkAssets } from './assets/loader';
import { drawBroadcastWipe, drawReplayDressing } from './broadcast';
import { cameraLabel, createCamera, cyclePreset, cycleTarget, triggerRefereeFocus, updateCamera } from './camera';
import { MatchPhase, Role, Team } from './enums';
import { pointOnField } from './field';
import { render } from './render';
import { createDirector, type ReplayDirector } from './replay/director';
import { createRecorder, type ReplayRecorder } from './replay/recorder';
import { resetCoach } from './sim/coach';
import { startHeader } from './sim/header';
import { resetPlayers } from './sim/players';
import { startReceive } from './sim/receive';
import { startPowerShot } from './sim/shot';
import { spawnReferee } from './sim/referee';
import { createWorld, resetBall, restartMatch, step } from './sim/world';
import type { RealGkHandle, RealGkHudPatch } from './types';

export interface RealGkEngineOptions {
  onHud: (patch: RealGkHudPatch) => void;
  /** Variant tunables (pitch size, sprite scale, camera). Defaults to the original v2 feel. */
  config?: RealGkConfig;
}

const clockStr = (time: number): string => {
  const seconds = Math.floor(time);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

const phaseFor = (time: number): string => (time < 45 ? 'First half' : time < 90 ? 'Second half' : 'Stoppage time');

/** Boots the Real Match Sim GK runtime onto a canvas. Returns imperative controls (incl. resize). */
export function createRealGkEngine(canvas: HTMLCanvasElement, opts: RealGkEngineOptions): RealGkHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;

  const config = opts.config ?? REAL_GK_V2_CONFIG;
  const assets = loadRealGkAssets(config.features !== undefined);
  const world = createWorld({ width: canvas.clientWidth || 800, height: canvas.clientHeight || 600 }, config);
  const cam = createCamera(world);
  const recorder: ReplayRecorder | null = config.features?.replay ? createRecorder() : null;
  const director: ReplayDirector | null = recorder ? createDirector(world, recorder, cam) : null;

  let paused = false;
  let speed = 1;
  let flat = false;
  let raf = 0;
  let lastT = performance.now();

  const last = {
    scoreBlue: -1,
    scoreRed: -1,
    clock: '',
    phase: '',
    statusTitle: '',
    statusText: '',
    ballText: '',
    paused: !paused,
    speed: -1,
    refereeActive: !world.referee.active,
    goalActive: true,
    replayActive: true,
  };

  const syncHud = (): void => {
    const { match, referee } = world;
    const patch: RealGkHudPatch = {};
    if (match.blue !== last.scoreBlue) patch.scoreBlue = last.scoreBlue = match.blue;
    if (match.red !== last.scoreRed) patch.scoreRed = last.scoreRed = match.red;
    const cs = clockStr(match.time);
    if (cs !== last.clock) patch.clock = last.clock = cs;
    const ph = phaseFor(match.time);
    if (ph !== last.phase) patch.phase = last.phase = ph;
    if (match.statusTitle !== last.statusTitle) patch.statusTitle = last.statusTitle = match.statusTitle;
    if (match.statusText !== last.statusText) patch.statusText = last.statusText = match.statusText;
    if (match.ballText !== last.ballText) patch.ballText = last.ballText = match.ballText;
    if (paused !== last.paused) patch.paused = last.paused = paused;
    if (speed !== last.speed) patch.speed = last.speed = speed;
    if (referee.active !== last.refereeActive) patch.refereeActive = last.refereeActive = referee.active;
    const goalActive = match.celebration > 0;
    if (goalActive !== last.goalActive) patch.goalActive = last.goalActive = goalActive;
    const replayActive = director?.replayActive() ?? false;
    if (replayActive !== last.replayActive) patch.replayActive = last.replayActive = replayActive;
    if (Object.keys(patch).length) opts.onHud(patch);
  };

  const resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || world.view.width;
    const h = canvas.clientHeight || world.view.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.imageSmoothingEnabled = false;
    world.view = { width: w, height: h };
    world.size = { width: w * config.fieldScale, height: h * config.fieldScale };
    world.dpr = dpr;
    if (world.players.length) {
      director?.reset();
      recorder?.clear();
      resetPlayers(world);
      resetBall(world, world.match.kickoffTeam);
      resetCoach(world);
    }
  };

  const frame = (now: number): void => {
    // A thrown frame must never kill the RAF loop (that reads as a hard freeze) — log once and keep going.
    try {
      const rawDt = Math.min(MAX_DT, (now - lastT) / 1000);
      lastT = now;
      const simRunning = world.match.phase === MatchPhase.Live || world.match.phase === MatchPhase.Celebration;
      if (!paused) {
        if (simRunning) step(world, rawDt * speed);
        if (director && recorder) {
          director.tick(rawDt, now);
          if (world.match.phase === MatchPhase.Live && world.match.celebration === 0) recorder.capture(world, now);
        }
      }
      const replayScene = director?.scene() ?? null;
      // Live camera follows play; during the replay flow the director owns the camera (snap + slow track).
      if (!replayScene && (world.match.phase === MatchPhase.Live || world.match.phase === MatchPhase.Celebration)) {
        updateCamera(cam, world, rawDt);
      }
      render(ctx, replayScene?.world ?? world, assets, cam, replayScene?.now ?? now, flat);
      if (director) {
        const overlayState = director.overlay();
        if (overlayState.dressing) drawReplayDressing(ctx, world.view, world.dpr, now);
        if (overlayState.wipeProgress !== null) drawBroadcastWipe(ctx, world.view, world.dpr, overlayState.wipeProgress);
      }
      syncHud();
    } catch (err) {
      console.error('[realgk] frame error (recovered)', err);
    }
    raf = requestAnimationFrame(frame);
  };

  resize();
  lastT = performance.now();
  raf = requestAnimationFrame(frame);
  syncHud();
  opts.onHud({ cameraLabel: cameraLabel(cam), targetLabel: 'Follow: ball' });

  return {
    togglePause: () => {
      paused = !paused;
      // Unpausing leaves a wall-clock hole in the ring (RAF keeps ticking); drop it so a fresh
      // goal takes the clean short-footage bail instead of lerping everything across the gap.
      if (!paused) recorder?.clear();
    },
    cycleSpeed: () => {
      speed = speed === 1 ? 2 : 1;
    },
    setFlat: (value: boolean) => {
      flat = value;
    },
    cycleCamera: () => opts.onHud({ cameraLabel: cyclePreset(cam) }),
    cycleTarget: () => opts.onHud({ targetLabel: cycleTarget(cam, world) }),
    restart: () => {
      director?.reset();
      recorder?.clear();
      restartMatch(world);
    },
    spawnReferee: () => {
      spawnReferee(world);
      triggerRefereeFocus(cam);
    },
    debugAction: (kind) => {
      if (!config.features) return;
      const squad = world.players.filter((p) => p.team === Team.Blue && p.role !== Role.GK);
      if (!squad.length) return;
      const p = squad.reduce((best, q) =>
        Math.hypot(q.x - world.ball.x, q.y - world.ball.y) < Math.hypot(best.x - world.ball.x, best.y - world.ball.y) ? q : best,
      );
      if (kind === 'header') startHeader(p);
      else if (kind === 'receive') startReceive(world, p, false);
      else if (kind === 'intercept') startReceive(world, p, true);
      else startPowerShot(p);
    },
    debugGoal: () => {
      // v4-only test hook — never active for v2/v3 (no features), so their 'g' stays a no-op.
      if (!config.features) return;
      if (world.match.phase !== MatchPhase.Live || world.match.celebration > 0) return;
      const { ball } = world;
      const squad = world.players.filter((p) => p.team === Team.Blue && p.role !== Role.GK);
      const shooter = squad.length
        ? squad.reduce((best, p) => (Math.hypot(p.x - ball.x, p.y - ball.y) < Math.hypot(best.x - ball.x, best.y - ball.y) ? p : best))
        : null;
      // Fire from close range into a top corner so the keeper rarely intercepts, regardless of viewport.
      const start = pointOnField(world.size, 0.9, 0.42);
      ball.ownerId = null;
      ball.lastKickerId = shooter?.id ?? null;
      ball.x = start.x;
      ball.y = start.y;
      ball.z = 4;
      ball.vx = 640;
      ball.vy = -40;
      ball.vz = 30;
      ball.spinRate = 0;
      ball.cooldown = 1.0;
    },
    resize,
    destroy: () => cancelAnimationFrame(raf),
  };
}
