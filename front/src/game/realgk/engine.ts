import { MAX_DT } from './constants';
import { REAL_GK_V2_CONFIG, type RealGkConfig } from './config';
import { loadRealGkAssets } from './assets/loader';
import { cameraLabel, createCamera, cyclePreset, cycleTarget, updateCamera } from './camera';
import { render } from './render';
import { resetCoach } from './sim/coach';
import { resetPlayers } from './sim/players';
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
  const assets = loadRealGkAssets();
  const world = createWorld({ width: canvas.clientWidth || 800, height: canvas.clientHeight || 600 }, config);
  const cam = createCamera(world);

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
      resetPlayers(world);
      resetBall(world, world.match.kickoffTeam);
      resetCoach(world);
    }
  };

  const frame = (now: number): void => {
    const rawDt = Math.min(MAX_DT, (now - lastT) / 1000);
    lastT = now;
    if (!paused) step(world, rawDt * speed);
    updateCamera(cam, world);
    render(ctx, world, assets, cam, now, flat);
    syncHud();
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
    },
    cycleSpeed: () => {
      speed = speed === 1 ? 2 : 1;
    },
    setFlat: (value: boolean) => {
      flat = value;
    },
    cycleCamera: () => opts.onHud({ cameraLabel: cyclePreset(cam) }),
    cycleTarget: () => opts.onHud({ targetLabel: cycleTarget(cam, world) }),
    restart: () => restartMatch(world),
    spawnReferee: () => spawnReferee(world),
    resize,
    destroy: () => cancelAnimationFrame(raf),
  };
}
