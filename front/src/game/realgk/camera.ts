import type { CamPreset } from './config';
import { fieldRatios, metrics } from './field';
import type { RealGkWorld } from './types';
import { clamp, lerp } from './util';

export interface RealGkCamera {
  x: number;
  y: number;
  z: number;
  presetIdx: number;
  targetIdx: number;
  presets: CamPreset[];
  cinematic: boolean;
}

export function createCamera(world: RealGkWorld): RealGkCamera {
  const presets = world.cfg.presets;
  return {
    x: world.size.width / 2,
    y: world.size.height / 2,
    z: presets[0].zoom,
    presetIdx: 0,
    targetIdx: -1,
    presets,
    cinematic: world.cfg.cinematic,
  };
}

export const cameraLabel = (cam: RealGkCamera): string => `Cam: ${cam.presets[cam.presetIdx].label}`;

export function cyclePreset(cam: RealGkCamera): string {
  cam.presetIdx = (cam.presetIdx + 1) % cam.presets.length;
  return cameraLabel(cam);
}

/** Cycles the followed subject: ball → each player → ball. */
export function cycleTarget(cam: RealGkCamera, world: RealGkWorld): string {
  cam.targetIdx++;
  if (cam.targetIdx >= world.players.length) cam.targetIdx = -1;
  if (cam.targetIdx < 0) return 'Follow: ball';
  return `Follow: ${world.players[cam.targetIdx].name}`;
}

/** Keeps the camera window inside the pitch; when the view is wider than the field it just centers. */
function clampToField(cam: RealGkCamera, world: RealGkWorld): void {
  const fw = world.size.width;
  const fh = world.size.height;
  const hw = world.view.width / (2 * cam.z);
  const hh = world.view.height / (2 * cam.z);
  cam.x = hw < fw / 2 ? clamp(cam.x, hw, fw - hw) : fw / 2;
  cam.y = hh < fh / 2 ? clamp(cam.y, hh, fh - hh) : fh / 2;
}

/** Smoothly tracks the subject with dynamic zoom (tighter near goal / on a goal), clamped to the pitch. */
export function updateCamera(cam: RealGkCamera, world: RealGkWorld): void {
  const preset = cam.presets[cam.presetIdx];
  const m = metrics(world.size);

  let tx: number;
  let ty: number;
  let zt: number;

  if (!preset.follow) {
    tx = world.size.width / 2;
    ty = (m.topY + m.bottomY) / 2;
    zt = preset.zoom;
  } else {
    const target = cam.targetIdx >= 0 ? world.players[cam.targetIdx] : null;
    const subject = target ?? world.ball;
    tx = subject.x;
    ty = subject.y;
    zt = preset.zoom;

    if (cam.cinematic && !target) {
      // Lead the ball so the frame anticipates play, and push in as it nears either goal.
      const { ball } = world;
      tx = ball.x + ball.vx * 0.16;
      ty = ball.y + ball.vy * 0.16;
      const ratio = fieldRatios(world.size, ball.x, ball.y);
      const nearGoal = clamp((Math.abs(ratio.lat - 0.5) * 2 - 0.35) / 0.65, 0, 1);
      zt = preset.zoom * lerp(0.95, 1.32, nearGoal);
      if (world.match.celebration > 0) zt = preset.zoom * 1.5;
    } else if (world.match.celebration > 0) {
      zt = preset.zoom * 1.22;
    } else {
      const ratio = fieldRatios(world.size, world.ball.x, world.ball.y);
      if (ratio.lat < 0.2 || ratio.lat > 0.8) zt = preset.zoom * 1.12;
    }
  }

  const posEase = cam.cinematic ? 0.072 : 0.09;
  const zoomEase = cam.cinematic ? 0.045 : 0.06;
  cam.x += (tx - cam.x) * posEase;
  cam.y += (ty - cam.y) * posEase;
  cam.z += (zt - cam.z) * zoomEase;

  clampToField(cam, world);
}
