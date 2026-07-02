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
  /** Scripted "focus the referee" cinematic — seconds remaining (0 = off). */
  refFocusT: number;
  /** Ace-Attorney camera shake — seconds remaining (0 = off) + running phase. */
  shakeT: number;
  shakePhase: number;
}

/** Duration of the referee focus cinematic + how long the shake rattles inside it. */
const REF_FOCUS_SECONDS = 1.7;
const REF_SHAKE_SECONDS = 0.6;
const REF_SHAKE_PX = 9;

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
    refFocusT: 0,
    shakeT: 0,
    shakePhase: 0,
  };
}

/** Kicks off the "objection!" beat: snap focus on the referee, punch the zoom in and rattle the frame. */
export function triggerRefereeFocus(cam: RealGkCamera): void {
  cam.refFocusT = REF_FOCUS_SECONDS;
  cam.shakeT = REF_SHAKE_SECONDS;
  cam.shakePhase = 0;
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
export function updateCamera(cam: RealGkCamera, world: RealGkWorld, dt = 0.016): void {
  const preset = cam.presets[cam.presetIdx];
  const m = metrics(world.size);

  let tx: number;
  let ty: number;
  let zt: number;

  // Scripted referee focus overrides normal follow: hard push-in on the ref while the beat runs.
  cam.refFocusT = Math.max(0, cam.refFocusT - dt);
  if (cam.refFocusT > 0 && world.referee.active) {
    tx = world.referee.x;
    ty = world.referee.y - 6;
    zt = preset.zoom * 2.1;
    const focusEase = 0.16;
    cam.x += (tx - cam.x) * focusEase;
    cam.y += (ty - cam.y) * focusEase;
    cam.z += (zt - cam.z) * 0.12;
    clampToField(cam, world);
    applyShake(cam, dt);
    return;
  }

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
      zt = preset.zoom * lerp(0.95, world.cfg.nearGoalPush ?? 1.32, nearGoal);
      if (world.match.celebration > 0) {
        // v4 sets a celebrant: chase the scorer's routine instead of the frozen ball.
        const celebrant = world.match.celebrantId !== null ? world.players.find((p) => p.id === world.match.celebrantId) : undefined;
        if (celebrant) {
          tx = celebrant.x;
          ty = celebrant.y;
        }
        zt = preset.zoom * 1.5;
      }
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
  applyShake(cam, dt);
}

/** Decaying rattle applied after positioning — quick, punchy oscillation on both axes. */
function applyShake(cam: RealGkCamera, dt: number): void {
  if (cam.shakeT <= 0) return;
  cam.shakeT = Math.max(0, cam.shakeT - dt);
  cam.shakePhase += dt;
  const decay = cam.shakeT / REF_SHAKE_SECONDS;
  const mag = (REF_SHAKE_PX / cam.z) * decay;
  cam.x += Math.sin(cam.shakePhase * 58) * mag;
  cam.y += Math.cos(cam.shakePhase * 47) * mag * 0.7;
}

/** Slow-mo replay camera: tight eased track on the recorded ball, no velocity lead (it jitters at 0.4×). */
export function updateReplayCamera(cam: RealGkCamera, world: RealGkWorld, targetX: number, targetY: number): void {
  const zt = clamp(cam.presets[0].zoom * 1.8, 2.6, 3.4);
  cam.x += (targetX - cam.x) * 0.14;
  cam.y += (targetY - cam.y) * 0.14;
  cam.z += (zt - cam.z) * 0.08;
  clampToField(cam, world);
}

/** Hard cut to a framing — used under the wipe's full-cover moment so the jump is never visible. */
export function snapCamera(cam: RealGkCamera, world: RealGkWorld, x: number, y: number, z: number): void {
  cam.x = x;
  cam.y = y;
  cam.z = z;
  clampToField(cam, world);
}
