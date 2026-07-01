import { resolveAssets } from './assets/loader';
import { getSharedCheckpoint, type CheckpointId } from './checkpoints/registry';
import { CANVAS, FIELD } from './core/constants';
import { createLoop } from './core/loop';
import type { EngineHandle, HudPatch, SimConfig, World } from './core/types';
import { buildHomography } from './math/homography';
import {
  cameraLabel,
  createCamera,
  cycleCamera,
  cycleTarget,
  resetCamera,
  updateCamera,
} from './render/camera';
import { renderScene } from './render/renderer';
import { createRainSystem } from './render/weather';
import { createWorld, startMatch, stepWorld } from './sim/world';

export interface EngineOptions {
  checkpoint: CheckpointId;
  onHud: (patch: HudPatch) => void;
}

const clockStr = (clock: number): string =>
  `${String(Math.floor(clock / 60)).padStart(2, '0')}:${String(Math.floor(clock % 60)).padStart(2, '0')}`;

/** Boots a checkpoint into a running engine bound to a canvas. Returns imperative controls. */
export function createEngine(canvas: HTMLCanvasElement, opts: EngineOptions): EngineHandle {
  const def = getSharedCheckpoint(opts.checkpoint);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;

  const assets = resolveAssets(def.manifest);
  const project = buildHomography(def.field.corners, CANVAS, FIELD);
  const startZoomed = def.skipIntro === true;
  const sim: SimConfig = { formations: def.formations, skipIntro: def.skipIntro };
  const world: World = createWorld(sim);
  const cam = createCamera(def.camera, startZoomed);
  const rain = createRainSystem(CANVAS, def.rain);

  const last = { scoreBlue: -1, scoreRed: -1, clock: '', eventSeq: -1, goalActive: false };

  const syncHud = (): void => {
    const patch: HudPatch = {};
    if (world.scoreBlue !== last.scoreBlue) patch.scoreBlue = last.scoreBlue = world.scoreBlue;
    if (world.scoreRed !== last.scoreRed) patch.scoreRed = last.scoreRed = world.scoreRed;
    const cs = clockStr(world.clock);
    if (cs !== last.clock) patch.clock = last.clock = cs;
    if (world.eventSeq !== last.eventSeq) {
      last.eventSeq = world.eventSeq;
      patch.eventText = world.event;
    }
    const goalActive = world.pausaGol > 0;
    if (goalActive !== last.goalActive) patch.goalActive = last.goalActive = goalActive;
    if (Object.keys(patch).length) opts.onHud(patch);
  };

  const update = (): void => {
    stepWorld(world, sim);
    syncHud();
  };

  const render = (): void => {
    const view = updateCamera(cam, world, project);
    renderScene(ctx, world, assets, project, view);
    rain.update();
    rain.draw(ctx);
  };

  const loop = createLoop(update, render);
  loop.start();

  opts.onHud({
    scoreBlue: 0,
    scoreRed: 0,
    clock: clockStr(0),
    eventText: world.event,
    paused: false,
    speed: 1,
    cameraLabel: cameraLabel(cam),
    targetLabel: 'TARGET: BALL',
    rainLabel: rain.label(),
  });

  return {
    togglePause: () => opts.onHud({ paused: loop.togglePause() }),
    cycleSpeed: () => opts.onHud({ speed: loop.cycleSpeed() }),
    cycleCamera: () => opts.onHud({ cameraLabel: cycleCamera(cam) }),
    cycleTarget: () => opts.onHud({ targetLabel: cycleTarget(world) }),
    cycleRain: () => opts.onHud({ rainLabel: rain.cycle() }),
    reset: () => {
      world.scoreBlue = 0;
      world.scoreRed = 0;
      world.clock = 0;
      world.pausaGol = 0;
      startMatch(world, sim);
      resetCamera(cam, startZoomed);
    },
    destroy: () => loop.stop(),
  };
}
