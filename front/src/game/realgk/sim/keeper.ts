import { DIVE_DURATION, DIVE_FORWARD, DIVE_LIFT, DIVE2_FLIGHT, DIVE2_LAUNCH, DIVE2_TRIGGER_RANGE } from '../constants';
import { BodyAnim, HeadView, PlayerAction, Role, Team } from '../enums';
import { goalCenterForTeam } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp, easeOutCubic, lerp } from '../util';
import { KEEPER_FRAME_CONFIG, type FrameCfg } from '../assets/configs';

const DEFAULT_CFG: FrameCfg = { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 };

export function keeperConfigFor(mode: BodyAnim, frameIdx: number): FrameCfg {
  const frames = KEEPER_FRAME_CONFIG[mode];
  if (!frames || !frames.length) return DEFAULT_CFG;
  return frames[Math.max(0, Math.min(frameIdx, frames.length - 1))];
}

/**
 * v6 dive frame timeline (seconds), ported from the approved candidate_01 preview and compressed for
 * in-game reaction time: two anticipation holds, a smeared launch (frame 1 → 2), extension and recovery.
 */
const DIVE2_STEPS: { frame: number; duration: number; smearFrom?: number }[] = [
  { frame: 0, duration: 0.22 },
  { frame: 1, duration: 0.2 },
  { frame: 2, duration: 0.26, smearFrom: 1 },
  { frame: 2, duration: 0.16 },
  { frame: 3, duration: 0.11 },
  { frame: 4, duration: 0.11 },
  { frame: 5, duration: 0.11 },
  { frame: 6, duration: 0.11 },
  { frame: 7, duration: 0.12 },
];

export const DIVE2_DURATION = DIVE2_STEPS.reduce((sum, s) => sum + s.duration, 0);

/**
 * Per-frame drawn-height ratios (relative to the standing frame 0) from the approved editor overrides:
 * targetHeight × frameHeight normalized against frame 0's 55 × 82.
 */
export const DIVE2_HEIGHT_RATIO = [1, 0.987, 0.559, 0.379, 0.863, 0.652, 0.751, 0.745];

export function dive2FrameAt(elapsed: number): number {
  let t = elapsed;
  for (const step of DIVE2_STEPS) {
    if (t <= step.duration) return step.frame;
    t -= step.duration;
  }
  return DIVE2_STEPS[DIVE2_STEPS.length - 1].frame;
}

/** Smear (ghost-trail) progress 0→1 while the launch step plays; null outside it. */
export function dive2SmearAt(elapsed: number): { from: number; to: number; t: number } | null {
  let t = elapsed;
  for (const step of DIVE2_STEPS) {
    if (t <= step.duration) {
      if (step.smearFrom === undefined) return null;
      return { from: step.smearFrom, to: step.frame, t: clamp(t / step.duration, 0, 1) };
    }
    t -= step.duration;
  }
  return null;
}

// Compact lateral dive is the main keeper save; v6's dive-v2 pack wins where explicitly enabled, and
// `keeperDiveSave` swaps in the playground's classic 8-frame gk_dive_save pack.
const diveAnimFor = (world: RealGkWorld): BodyAnim => {
  if (world.cfg.features?.keeperDiveV2) return BodyAnim.GkDiveV2;
  return world.cfg.features?.keeperDiveSave ? BodyAnim.GkDive : BodyAnim.GkDiveCompact;
};

const diveDurationFor = (anim: BodyAnim): number => (anim === BodyAnim.GkDiveV2 ? DIVE2_DURATION : DIVE_DURATION);

export function startKeeperDive(player: RealGkPlayer, dir: number, targetX: number, targetY: number, anim: BodyAnim = BodyAnim.GkDive): boolean {
  if (player.role !== Role.GK || player.actionTimer > 0 || player.saveCooldown > 0) return false;
  const duration = diveDurationFor(anim);
  player.action = PlayerAction.Dive;
  player.actionTimer = duration;
  player.actionElapsed = 0;
  player.diveStartX = player.x;
  player.diveStartY = player.y;
  player.diveDir = dir || player.facing || player.dir;
  player.targetX = targetX;
  player.targetY = targetY;
  player.facing = player.diveDir < 0 ? -1 : 1;
  player.lookX = player.facing;
  player.lookY = 0;
  player.mode = anim;
  player.modeLock = duration;
  return true;
}

export function updateKeeperDive(player: RealGkPlayer, dt: number): boolean {
  if (player.action !== PlayerAction.Dive || player.actionTimer <= 0) return false;
  const isV2 = player.mode === BodyAnim.GkDiveV2;
  const duration = diveDurationFor(player.mode);
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.actionElapsed += dt;
  const t = clamp(player.actionElapsed / duration, 0, 1);
  // v2 holds the crouch through the anticipation frames, then launches over the flight window.
  const flightT = isV2 ? clamp((player.actionElapsed - DIVE2_LAUNCH) / DIVE2_FLIGHT, 0, 1) : t;
  const forward = lerp(0, DIVE_FORWARD, easeOutCubic(flightT));
  const lift = Math.sin(flightT * Math.PI) * DIVE_LIFT;
  // v2 dives to the ball's crossing line (full lateral tracking, so the keeper visibly picks the right
  // side); legacy keeps its subtle drift.
  const settleY = isV2
    ? (player.targetY - player.diveStartY) * easeOutCubic(flightT)
    : (player.targetY - player.diveStartY) * t * 0.35;
  player.x = player.diveStartX + forward * player.diveDir;
  player.y = player.diveStartY - lift + settleY;
  player.vx = 0;
  player.vy = 0;
  if (player.actionTimer <= 0) {
    player.action = PlayerAction.None;
    player.saveCooldown = 0.55;
    player.mode = BodyAnim.GkIdle;
  }
  return true;
}

/** Manual dive for the keyboard-controlled keeper: side < 0 dives toward the top post, > 0 toward the
 *  bottom one, always dashing forward into the pitch (never backward into his own goal). */
export function controlKeeperDive(world: RealGkWorld, side: -1 | 1): boolean {
  const player = world.players.find((p) => p.id === world.controlId);
  if (!player || player.role !== Role.GK) return false;
  const reach = 72 * (world.cfg.fieldScale / 1.5);
  return startKeeperDive(player, player.dir, player.x, player.y + side * reach, diveAnimFor(world));
}

export function maybeTriggerKeeperDive(world: RealGkWorld, player: RealGkPlayer): boolean {
  const { ball, size } = world;
  const isV2 = world.cfg.features?.keeperDiveV2 === true;
  if (player.role !== Role.GK || player.actionTimer > 0 || player.saveCooldown > 0 || ball.ownerId || ball.z > 32) {
    return false;
  }
  // The lane/range/reach windows are px values tuned on the hero pitch (fieldScale 1.5). The goal
  // mouth scales with the world, so wider pitches (personas 1.85) must scale them too — otherwise
  // corner-bound shots cross outside the fixed window and the keeper never reacts.
  const windowScale = world.cfg.fieldScale / 1.5;
  const goalCenter = goalCenterForTeam(size, player.team);
  const towardGoal = player.team === Team.Blue ? ball.vx < -80 : ball.vx > 80;
  const closeLane = Math.abs(ball.y - goalCenter.y) < 82 * windowScale;
  const approachingKeeper = Math.abs(ball.x - player.x) < (isV2 ? DIVE2_TRIGGER_RANGE : 150) * windowScale;
  if (!towardGoal || !closeLane || !approachingKeeper) return false;

  // v2 aims at where the ball will actually cross the keeper's line; legacy uses the short fixed lead.
  const lead = isV2
    ? clamp(Math.abs(ball.x - player.x) / Math.max(120, Math.abs(ball.vx)), 0.08, 0.5)
    : clamp(0.1 + Math.abs(ball.vx) / 900, 0.1, 0.2);
  const targetX = ball.x + ball.vx * lead;
  const targetY = ball.y + ball.vy * lead;
  if (Math.abs(targetY - player.y) > 54 * windowScale) return false;

  // Only dash toward the pitch — never backward into the keeper's own goal.
  return startKeeperDive(player, player.dir, targetX, targetY, diveAnimFor(world));
}
