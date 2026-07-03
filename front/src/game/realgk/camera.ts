import type { CamPreset } from './config';
import { RefPhase } from './enums';
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
  /** Scripted "focus the referee" cinematic — follows his spawn → run → card beat until it ends. */
  refFocus: boolean;
  /** Edge-trigger so the red-card shake fires exactly once when the card comes up. */
  cardShaken: boolean;
  /** True while the red card is up — used to hand the camera to the coach once it ends. */
  cardActive: boolean;
  /** Post-card "focus the coach" beat — seconds remaining (0 = off). */
  coachFocusT: number;
  /** Ace-Attorney camera shake — seconds remaining (0 = off) + running phase. */
  shakeT: number;
  shakePhase: number;
}

/** How long the shake rattles + its strength. */
const REF_SHAKE_SECONDS = 0.6;
const REF_SHAKE_PX = 9;

/** Referee phases that keep the camera locked on him (spawn run-in → pause → red card). */
const REF_EVENT_PHASES = new Set<RefPhase>([RefPhase.RunCenter, RefPhase.Pause, RefPhase.Card]);

/** How long the camera lingers on the coach after the red card. */
const COACH_FOCUS_SECONDS = 2.0;

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
    refFocus: false,
    cardShaken: false,
    cardActive: false,
    coachFocusT: 0,
    shakeT: 0,
    shakePhase: 0,
  };
}

/** Kicks off the "objection!" beat: lock focus on the referee through his run-in + card, rattle the frame. */
export function triggerRefereeFocus(cam: RealGkCamera): void {
  cam.refFocus = true;
  cam.cardShaken = false;
  cam.cardActive = false;
  cam.coachFocusT = 0;
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

  // After the red card, linger on the coach for a beat.
  cam.coachFocusT = Math.max(0, cam.coachFocusT - dt);
  if (cam.coachFocusT > 0) {
    cam.x += (world.coach.x - cam.x) * 0.14;
    cam.y += (world.coach.y - 8 - cam.y) * 0.14;
    cam.z += (preset.zoom * 1.7 - cam.z) * 0.1;
    clampToField(cam, world);
    applyShake(cam, dt);
    return;
  }

  // Scripted referee focus: follow him through the run-in and stay locked (tighter) on the red card.
  if (cam.refFocus && world.referee.active && REF_EVENT_PHASES.has(world.referee.phase)) {
    const onCard = world.referee.phase === RefPhase.Card;
    if (onCard) {
      cam.cardActive = true;
      if (!cam.cardShaken) {
        cam.cardShaken = true;
        cam.shakeT = REF_SHAKE_SECONDS;
        cam.shakePhase = 0;
      }
    }
    cam.x += (world.referee.x - cam.x) * 0.16;
    cam.y += (world.referee.y - 6 - cam.y) * 0.16;
    cam.z += (preset.zoom * (onCard ? 2.6 : 2.0) - cam.z) * 0.12;
    clampToField(cam, world);
    applyShake(cam, dt);
    return;
  }
  // Beat ended: release the referee lock and, if a card just happened, hand the camera to the coach.
  if (cam.refFocus && !REF_EVENT_PHASES.has(world.referee.phase)) {
    cam.refFocus = false;
    if (cam.cardActive) {
      cam.cardActive = false;
      cam.coachFocusT = COACH_FOCUS_SECONDS;
    }
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
