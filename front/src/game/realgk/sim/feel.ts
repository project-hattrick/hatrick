import { BodyAnim, PlayerAction, Role, Team } from '../enums';
import { spawnFootDust } from '../effects';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { kickBall } from './ball';

/**
 * Keeper-feel experiments (France GK sandbox, `?control=gk-player-v2`): each flag is one independently
 * toggleable smoothing technique that hides or softens sprite-transition cuts. All default OFF so every
 * legacy checkpoint stays byte-identical; the sandbox seeds a preset via `RealGkConfig.feel` and flips
 * flags live through `handle.setFeel` (the Feel lab panel).
 */
export interface RealGkFeel {
  /** Loop anims run on a per-player clock that restarts at frame 0 on a mode switch — the global-clock
   *  sampling made every switch land on an arbitrary frame of the new cycle (the "jump" you see). */
  animPhase: boolean;
  /** Controlled keeper: a new locomotion mode must be sustained briefly (debounce) and the current one
   *  held a minimum time, so near-threshold velocities stop flickering shuffle ⇄ run-side ⇄ idle. */
  modeHold: boolean;
  /** Keeper idle is alive: animated ready stance while a shot threatens + a subtle breathing bob. */
  idleLife: boolean;
  /** A dive ends through a crouched rise (GkReady) instead of snapping straight to the standing frame. */
  diveRecovery: boolean;
  /** X punt plays a crouch anticipation before the ball flies (was an instant, bodiless kick). */
  puntWindup: boolean;
  /** Hitstop (a few frozen frames) + a camera rattle the moment a diving save wins the ball. */
  saveImpact: boolean;
  /** Foot dust on the controlled keeper's hard reversals (masks the abrupt velocity cut). */
  skidDust: boolean;
  /** EXPERIMENT: the controlled keeper's sprite leans into horizontal velocity (skew). */
  leanTilt: boolean;
  /** EXPERIMENT: a brief fading ghost of the previous frame bridges keeper locomotion switches. */
  crossfade: boolean;
}

export const defaultFeel = (): RealGkFeel => ({
  animPhase: false,
  modeHold: false,
  idleLife: false,
  diveRecovery: false,
  puntWindup: false,
  saveImpact: false,
  skidDust: false,
  leanTilt: false,
  crossfade: false,
});

/** UI metadata for the feel toggles — shared by the arena panel and the comparison grid (single source). */
export interface FeelTechnique {
  key: keyof RealGkFeel;
  label: string;
  hint: string;
  /** Purely-visual experiments (leanTilt / crossfade) — off in the default preset. */
  exp?: boolean;
}

export const FEEL_TECHNIQUES: FeelTechnique[] = [
  { key: 'animPhase', label: 'Frame sync', hint: 'Restart the walk/run cycle at frame 0 on every switch' },
  { key: 'modeHold', label: 'Mode debounce', hint: 'Stop the idle/run/shuffle flicker at threshold speeds' },
  { key: 'idleLife', label: 'Living idle', hint: 'Breathing bob + a ready crouch when a shot threatens' },
  { key: 'diveRecovery', label: 'Dive recovery', hint: 'Rise through a crouch instead of snapping upright' },
  { key: 'puntWindup', label: 'Punt wind-up', hint: 'Crouch before the punt flies' },
  { key: 'saveImpact', label: 'Save impact', hint: 'Hitstop + camera rattle on a diving catch' },
  { key: 'skidDust', label: 'Skid dust', hint: 'Dust puff on a hard reversal' },
  { key: 'leanTilt', label: 'Lean tilt', hint: 'Skew the sprite into its motion', exp: true },
  { key: 'crossfade', label: 'Crossfade', hint: 'Dissolve the previous frame under the new one', exp: true },
];

/** Every technique on (the maximal combined feel) — the grid's "All on" cell. */
export const allFeelOn = (): RealGkFeel => {
  const f = defaultFeel();
  for (const t of FEEL_TECHNIQUES) f[t.key] = true;
  return f;
};

/** Sandbox default: the core smoothing on, the two visual experiments opt-in. */
export const SMOOTH_FEEL_PRESET: RealGkFeel = {
  animPhase: true,
  modeHold: true,
  idleLife: true,
  diveRecovery: true,
  puntWindup: true,
  saveImpact: true,
  skidDust: true,
  leanTilt: false,
  crossfade: false,
};

/** Per-player scratch state for the feel experiments. Inert while every `world.feel` flag is off. */
export interface PlayerFeelState {
  /** Per-player loop clock (seconds since the last mode switch) — drives `animPhase`. */
  animClock: number;
  /** Last mode seen by the feel tick (mode-switch edge detection). */
  prevMode: BodyAnim;
  /** Last action seen (Dive→None edge detection for dive recovery). */
  prevAction: PlayerAction;
  /** `modeHold` debounce: candidate mode + how long it has been sustained. */
  pendingMode: BodyAnim | null;
  pendingTime: number;
  /** Seconds since the current mode was committed (min-hold gate). */
  holdTime: number;
  /** Dive-recovery seconds left (crouched rise to standing). 0 = none. */
  recover: number;
  /** Punt wind-up seconds left; the kick fires when it reaches 0. */
  punt: number;
  puntX: number;
  puntY: number;
  /** Render-side crossfade scratch (mutated by drawPlayer; harmless elsewhere). */
  ghostMode: BodyAnim | null;
  ghostFrame: number;
  ghostAge: number;
  lastDrawnMode: BodyAnim | null;
  lastDrawnFrame: number;
}

export const freshPlayerFeel = (mode: BodyAnim): PlayerFeelState => ({
  animClock: 0,
  prevMode: mode,
  prevAction: PlayerAction.None,
  pendingMode: null,
  pendingTime: 0,
  holdTime: 0,
  recover: 0,
  punt: 0,
  puntX: 0,
  puntY: 0,
  ghostMode: null,
  ghostFrame: 0,
  ghostAge: 0,
  lastDrawnMode: null,
  lastDrawnFrame: 0,
});

/** One-shot feel effects, produced by the sim and consumed by the loop (see RealGkWorld.feelFx). */
export interface FeelFxState {
  /** Sim-freeze seconds left (save-contact hitstop; render keeps drawing). */
  hitstop: number;
  /** Camera-shake request in seconds (the engine hands it to the camera and clears it). */
  shake: number;
}

const MODE_DEBOUNCE = 0.07;
const MODE_MIN_HOLD = 0.16;
/** Crouched rise after a dive before returning to the standing idle. */
export const RECOVER_TOTAL = 0.42;
const PUNT_WINDUP = 0.2;
const PUNT_POWER = 400;

/**
 * Ticks the per-player feel timers. Runs at the TOP of the sim step (every phase) so `animClock`
 * advances for looping sprites everywhere and the GK recover/punt state machines see this frame's dt.
 * It only manages TIMERS + fires the punt kick — the controlled-keeper POSE is owned by control.ts,
 * which reads `recover`/`punt` to lock the right frame (avoids an ordering fight over `player.mode`).
 */
export function updateFeel(world: RealGkWorld, dt: number): void {
  for (const p of world.players) {
    const fs = p.feel;
    if (p.mode !== fs.prevMode) {
      fs.prevMode = p.mode;
      fs.animClock = 0;
      fs.holdTime = 0;
    } else {
      fs.animClock += dt;
      fs.holdTime += dt;
    }
    if (p.role !== Role.GK) {
      fs.prevAction = p.action;
      continue;
    }

    // Dive recovery: catch the Dive→None edge and arm a crouched rise (control.ts holds GkReady).
    if (world.feel.diveRecovery && fs.prevAction === PlayerAction.Dive && p.action === PlayerAction.None) {
      fs.recover = RECOVER_TOTAL;
    }
    fs.prevAction = p.action;
    if (fs.recover > 0) fs.recover = Math.max(0, fs.recover - dt);

    // Punt wind-up: the ball flies at the END of the crouch, not on the key press.
    if (fs.punt > 0) {
      fs.punt = Math.max(0, fs.punt - dt);
      if (fs.punt <= 0 && world.ball.ownerId === p.id) {
        kickBall(world, p, fs.puntX, fs.puntY, PUNT_POWER, true);
        spawnFootDust(world, p.x, p.y, 170, p.facing || 1);
        if (world.feel.saveImpact) world.feelFx.shake = Math.max(world.feelFx.shake, 0.2);
      }
    }
  }
}

/** Arms the punt crouch (feel.puntWindup). The kick itself fires from updateFeel at contact time. */
export function startPuntWindup(world: RealGkWorld, keeper: RealGkPlayer, targetX: number, targetY: number): void {
  const fs = keeper.feel;
  if (fs.punt > 0 || fs.recover > 0 || keeper.action !== PlayerAction.None) return;
  fs.punt = PUNT_WINDUP;
  fs.puntX = targetX;
  fs.puntY = targetY;
}

/** Commits a locomotion mode for the controlled keeper, optionally through the debounce + min-hold. */
export function commitControlledMode(player: RealGkPlayer, desired: BodyAnim, dt: number, hold: boolean): void {
  if (!hold) {
    player.mode = desired;
    return;
  }
  const fs = player.feel;
  if (desired === player.mode) {
    fs.pendingMode = null;
    fs.pendingTime = 0;
    return;
  }
  if (fs.pendingMode !== desired) {
    fs.pendingMode = desired;
    fs.pendingTime = 0;
    return;
  }
  fs.pendingTime += dt;
  if (fs.pendingTime >= MODE_DEBOUNCE && fs.holdTime >= MODE_MIN_HOLD) {
    player.mode = desired;
    fs.pendingMode = null;
    fs.pendingTime = 0;
  }
}

/** Whether a loose ball is menacing the keeper's goal — drives the animated ready stance (idleLife). */
export function keeperThreatened(world: RealGkWorld, keeper: RealGkPlayer): boolean {
  const { ball } = world;
  if (ball.ownerId != null) return false;
  const scale = world.cfg.fieldScale / 1.5;
  const dist = Math.hypot(ball.x - keeper.x, ball.y - keeper.y);
  const towardGoal = keeper.team === Team.Blue ? ball.vx < -40 : ball.vx > 40;
  return (towardGoal && dist < 360 * scale) || dist < 140 * scale;
}
