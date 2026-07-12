import { BILLBOARDS } from './billboards';
import type { CamPreset } from './config';
import { IntroStage, RefPhase, RestartKind, RestartStage, Team } from './enums';
import { fieldRatios, goalCenterForTeam, metrics, pointOnField } from './field';
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
  /** v5 periodic sponsor sweep during Live lulls — seconds remaining (0 = off). */
  sponsorT: number;
  /** Seconds until the next sponsor sweep may fire. */
  sponsorCooldown: number;
}

/** How long the shake rattles + its strength. */
const REF_SHAKE_SECONDS = 0.6;
const REF_SHAKE_PX = 9;

/** v5 sponsor sweep timing: the intro pan length, the in-play pan length, and the gap between in-play sweeps. */
const INTRO_SWEEP_SECONDS = 3.4;
/** Length of one HoldLoop camera cycle (board glide → team push-ins → wide crane). */
const HOLD_CYCLE_SECONDS = 14;
const SPONSOR_LIVE_SECONDS = 3.4;
const SPONSOR_COOLDOWN_SECONDS = 80;

/** Referee phases that keep the camera locked on him (spawn run-in → pause → whistle / red card). */
const REF_EVENT_PHASES = new Set<RefPhase>([RefPhase.RunCenter, RefPhase.Pause, RefPhase.Whistle, RefPhase.Card]);

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
    sponsorT: 0,
    sponsorCooldown: SPONSOR_COOLDOWN_SECONDS,
  };
}

/** The perimeter sponsor-board band in field pixels (x span + center y) — the sweep path. */
function sponsorBand(world: RealGkWorld): { xLeft: number; xRight: number; y: number } {
  const { width, height } = world.size;
  let minX = 1;
  let maxX = 0;
  let sumY = 0;
  let n = 0;
  for (const bb of BILLBOARDS) {
    for (const [x, y] of bb.corners) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      sumY += y;
      n += 1;
    }
  }
  const yRatio = n ? sumY / n : 0.32;
  return { xLeft: minX * width, xRight: maxX * width, y: yRatio * height + height * 0.06 };
}

/**
 * v5 pre-match camera: wide showcase → glide across the sponsor boards → follow the walking-on squads with a
 * gentle zoom pulse → lock on the referee's whistle → settle on the ball for kickoff.
 */
export function updateIntroCamera(cam: RealGkCamera, world: RealGkWorld): void {
  const { match, size } = world;
  const preset = cam.presets[cam.presetIdx];
  const m = metrics(size);
  const centerX = size.width / 2;
  const centerY = (m.topY + m.bottomY) / 2;

  let tx = centerX;
  let ty = centerY;
  let zt = preset.zoom;

  switch (match.introStage) {
    case IntroStage.Showcase:
      // Wide full-pitch framing behind the team + flag card.
      zt = 0.72;
      break;
    case IntroStage.SponsorSweep: {
      const band = sponsorBand(world);
      const p = clamp(match.introTimer / INTRO_SWEEP_SECONDS, 0, 1);
      tx = lerp(band.xLeft, band.xRight, p);
      ty = band.y;
      zt = 1.25;
      break;
    }
    case IntroStage.RiseIn: {
      // Follow the centroid of the players still walking on, easing wide → broadcast with a soft zoom pulse.
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (const pl of world.players) {
        const home = pointOnField(size, pl.homeLat, pl.homeDepth);
        if (Math.hypot(home.x - pl.x, home.y - pl.y) > 10) {
          sx += pl.x;
          sy += pl.y;
          n += 1;
        }
      }
      tx = n ? sx / n : centerX;
      ty = n ? sy / n : centerY;
      const t = clamp(match.introTimer / 3, 0, 1);
      zt = lerp(0.85, preset.zoom, t) + 0.07 * Math.sin(match.introTimer * 1.6);
      break;
    }
    case IntroStage.HoldLoop: {
      // Buffering hold (feed-driven): loop cinematic beats until the first event releases the kickoff.
      // 14s cycle: board glide (direction alternates per cycle) → push-in on Blue → on Red → wide crane.
      const cycle = match.introTimer % HOLD_CYCLE_SECONDS;
      const reverse = Math.floor(match.introTimer / HOLD_CYCLE_SECONDS) % 2 === 1;
      if (cycle < 5) {
        const band = sponsorBand(world);
        const p = cycle / 5;
        tx = lerp(reverse ? band.xRight : band.xLeft, reverse ? band.xLeft : band.xRight, p);
        ty = band.y;
        zt = 1.25;
      } else if (cycle < 12) {
        const team = cycle < 8.5 ? Team.Blue : Team.Red;
        let sx = 0;
        let sy = 0;
        let n = 0;
        for (const pl of world.players) {
          if (pl.team !== team) continue;
          sx += pl.x;
          sy += pl.y;
          n += 1;
        }
        tx = n ? sx / n : centerX;
        ty = n ? sy / n : centerY;
        zt = preset.zoom * 1.35 + 0.06 * Math.sin(match.introTimer * 1.3);
      } else {
        zt = 0.75; // wide crane over the full pitch before the next pass
      }
      break;
    }
    case IntroStage.RefWhistle:
      tx = world.referee.x;
      ty = world.referee.y - 6;
      zt = preset.zoom * 1.5;
      break;
    case IntroStage.Kickoff:
      tx = world.ball.x;
      ty = world.ball.y;
      zt = preset.zoom;
      break;
  }

  cam.x += (tx - cam.x) * 0.06;
  cam.y += (ty - cam.y) * 0.06;
  cam.z += (zt - cam.z) * 0.05;
  clampToField(cam, world);
}

/** Plain camera rattle (no referee focus / zoom) — used for the keeper save-impact beat (feel.saveImpact). */
export function requestShake(cam: RealGkCamera, seconds: number): void {
  cam.shakeT = Math.max(cam.shakeT, seconds);
  if (cam.shakeT === seconds) cam.shakePhase = 0;
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

  // v5 set-piece framing: hold the shot on the restart scene while it's being staged.
  if (world.cfg.features?.deadBallSequence && updateRestartCamera(cam, world, dt)) return;

  // v5: periodic broadcast sponsor sweep during a calm, loose midfield ball — glide wide across the boards.
  if (world.cfg.features?.matchIntro) {
    // Never sweep during a goal, restart or referee beat — abort any in-flight sweep so the camera stays on play.
    const canSweep = world.match.celebration === 0 && !world.match.restart && !cam.refFocus && !cam.cardActive;
    if (!canSweep) {
      cam.sponsorT = 0;
    } else {
      cam.sponsorCooldown = Math.max(0, cam.sponsorCooldown - dt);
      if (cam.sponsorT > 0) {
        cam.sponsorT = Math.max(0, cam.sponsorT - dt);
        const band = sponsorBand(world);
        const p = 1 - cam.sponsorT / SPONSOR_LIVE_SECONDS;
        cam.x += (lerp(band.xLeft, band.xRight, p) - cam.x) * 0.05;
        cam.y += (band.y - cam.y) * 0.05;
        cam.z += (1.2 - cam.z) * 0.04;
        clampToField(cam, world);
        if (cam.sponsorT === 0) cam.sponsorCooldown = SPONSOR_COOLDOWN_SECONDS;
        return;
      }
      // Only when the ball is loose in midfield — never cut away from a player carrying the ball.
      const ballRatio = fieldRatios(world.size, world.ball.x, world.ball.y);
      const calm = cam.sponsorCooldown === 0 && cam.targetIdx < 0 && preset.follow && !world.ball.ownerId && ballRatio.lat > 0.34 && ballRatio.lat < 0.66;
      if (calm) cam.sponsorT = SPONSOR_LIVE_SECONDS;
    }
  }

  // Keeper-control (manual sandbox): dead-zone follow so the keeper visibly MOVES inside the frame — a
  // tight follow glued him to screen-center and read as "not responding". The camera only nudges once he
  // nears the edge of the box, so small inputs are legible and he never leaves the screen.
  if (world.cfg.keeperControl && !world.cfg.keeperAutopilot && preset.follow) {
    const kt = cam.targetIdx >= 0 && cam.targetIdx < world.players.length ? world.players[cam.targetIdx] : null;
    if (kt && kt.id === world.controlId) {
      const dzx = (world.view.width / (2 * cam.z)) * 0.6;
      const dzy = (world.view.height / (2 * cam.z)) * 0.6;
      let nx = cam.x;
      let ny = cam.y;
      if (kt.x > cam.x + dzx) nx = kt.x - dzx;
      else if (kt.x < cam.x - dzx) nx = kt.x + dzx;
      if (kt.y > cam.y + dzy) ny = kt.y - dzy;
      else if (kt.y < cam.y - dzy) ny = kt.y + dzy;
      cam.x += (nx - cam.x) * 0.1;
      cam.y += (ny - cam.y) * 0.1;
      cam.z += (preset.zoom - cam.z) * 0.06;
      clampToField(cam, world);
      applyShake(cam, dt);
      return;
    }
  }

  if (!preset.follow) {
    tx = world.size.width / 2;
    ty = (m.topY + m.bottomY) / 2;
    zt = preset.zoom;
  } else {
    // Bounds-checked: a send-off can shrink the roster under a stale target index.
    const target = cam.targetIdx >= 0 && cam.targetIdx < world.players.length ? world.players[cam.targetIdx] : null;
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

  // Lift the framing toward the far touchline (billboards / telões) so the action reads nearer them.
  if (preset.follow) ty -= (world.cfg.cameraLift ?? 0) * (m.bottomY - m.topY);

  const posEase = cam.cinematic ? 0.072 : 0.09;
  const zoomEase = cam.cinematic ? 0.045 : 0.06;
  cam.x += (tx - cam.x) * posEase;
  cam.y += (ty - cam.y) * posEase;
  cam.z += (zt - cam.z) * zoomEase;

  clampToField(cam, world);
  applyShake(cam, dt);
}

/**
 * Frames an in-progress dead-ball restart: the fallen player on a foul, then the spot↔goal axis with
 * per-kind tightness (penalty = tight on the spot, corner = the box, throw-in = the line) and a slow
 * dolly-in once everyone is set. Returns true while it owns the camera; BallOut/Taking fall through so
 * the regular follow tracks the rolling / struck ball.
 */
function updateRestartCamera(cam: RealGkCamera, world: RealGkWorld, dt: number): boolean {
  const r = world.match.restart;
  if (!r) return false;
  if (r.stage === RestartStage.BallOut || r.stage === RestartStage.Taking) return false;
  const preset = cam.presets[cam.presetIdx];

  if (r.stage === RestartStage.FoulFreeze || r.stage === RestartStage.RefArrive) {
    // The referee run-in is owned by the refFocus beat; until it starts, hold on the fallen player.
    const at = r.foul?.at;
    if (!at) return false;
    cam.x += (at.x - cam.x) * 0.09;
    cam.y += (at.y - cam.y) * 0.09;
    cam.z += (preset.zoom * 1.7 - cam.z) * 0.07;
    clampToField(cam, world);
    applyShake(cam, dt);
    return true;
  }

  let bias = 0.15; // how far the framing leans from the spot toward the attacked goal
  let zoomMul = 1.1;
  if (r.kind === RestartKind.Penalty) {
    bias = 0.55;
    zoomMul = 1.5;
  } else if (r.kind === RestartKind.FreeKick) {
    bias = 0.3;
    zoomMul = 1.22;
  } else if (r.kind === RestartKind.Corner) {
    bias = 0.45;
    zoomMul = 1.18;
  } else if (r.kind === RestartKind.GoalKick) {
    bias = 0.12;
    zoomMul = 1.05;
  }
  const push = r.stage === RestartStage.Ready ? 0.06 : 0;
  const goal = goalCenterForTeam(world.size, r.team === Team.Blue ? Team.Red : Team.Blue);
  cam.x += (lerp(r.spot.x, goal.x, bias) - cam.x) * 0.05;
  cam.y += (lerp(r.spot.y, goal.y, bias) - cam.y) * 0.05;
  cam.z += (preset.zoom * (zoomMul + push) - cam.z) * 0.035;
  clampToField(cam, world);
  applyShake(cam, dt);
  return true;
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

/** Slow-mo replay camera: tight eased track on the recorded ball, no velocity lead (it jitters at 0.4×).
 *  `progress01` is the playback position (goal = 1): the zoom ramps in so the final shot reads closest. */
export function updateReplayCamera(cam: RealGkCamera, world: RealGkWorld, targetX: number, targetY: number, progress01 = 0): void {
  const zt = clamp(cam.presets[0].zoom * 1.8 * (1 + 0.5 * progress01 * progress01), 2.6, 4.6);
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
