import { BodyAnim, KickIntent, PlayerAction, Team } from '../enums';
import { pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { kickBall } from './ball';
import { Status } from './messages';
import { setStatus } from './rules';

/** Power-shot power + per-view timing (side is a longer 6-frame wind-up; front/back are 4 frames). */
const SHOT_POWER = 470;
function shotTiming(mode: BodyAnim): { dur: number; contact: number } {
  return mode === BodyAnim.PowerShotSide ? { dur: 0.72, contact: 0.66 } : { dur: 0.52, contact: 0.54 };
}

/** The goal the player is attacking — the exact point the strike is aimed at (shared by start + update). */
function goalPointFor(world: RealGkWorld, player: RealGkPlayer): { x: number; y: number } {
  return pointOnField(world.size, player.team === Team.Blue ? 0.99 : 0.01, 0.5);
}

/**
 * The ball owner winds up a power shot; the actual strike fires at the contact frame. The pose follows the
 * DIRECTION TO THE GOAL (the same vector the ball travels), so the striker always faces where the ball goes:
 * rear pose when the goal is up/away, front when it's down/toward the camera, profile when it's mostly sideways.
 */
export function startPowerShot(world: RealGkWorld, player: RealGkPlayer, personas = false): boolean {
  const goal = goalPointFor(world, player);
  const gdx = goal.x - player.x;
  const gdy = goal.y - player.y;
  const upward = gdy < -Math.abs(gdx) * 0.35; // goal is clearly above → ball travels up
  const downward = gdy > Math.abs(gdx) * 0.35; // goal is clearly below → ball travels down
  if (Math.abs(gdx) > 1) player.facing = gdx < 0 ? -1 : 1; // face the goal horizontally (mirrors side/front)

  let mode = BodyAnim.PowerShotSide;
  let idle = player.idleMode;
  if (personas) {
    // Persona casting has only front/rear shot bodies — rear when the ball goes up, front otherwise
    // (down + sideways). Both are headless; the persona head composites on top.
    mode = upward ? BodyAnim.ShotBack : BodyAnim.ShotFront;
    idle = upward ? BodyAnim.IdleBack : BodyAnim.IdleFront;
  } else if (upward) {
    mode = BodyAnim.PowerShotBack;
    idle = BodyAnim.IdleBack;
  } else if (downward) {
    mode = BodyAnim.PowerShotFront;
    idle = BodyAnim.IdleFront;
  }
  player.action = PlayerAction.PowerShot;
  player.actionTimer = shotTiming(mode).dur;
  player.actionElapsed = 0;
  player.mode = mode;
  player.modeLock = shotTiming(mode).dur;
  player.idleMode = idle;
  player.powerShotHit = false;
  player.vx = 0;
  player.vy = 0;
  return true;
}

/**
 * Fires a shot on goal from the owner — the animated persona/power wind-up when enabled, else the legacy
 * instant strike. Shared by the autonomous owner AI (decideOwnerAction) and the feed director (injectShot).
 */
export function commitShot(world: RealGkWorld, owner: RealGkPlayer): void {
  if (world.cfg.features?.extraAnims || world.cfg.features?.personaShot) {
    startPowerShot(world, owner, world.cfg.features?.personaHeads === true);
    return;
  }
  const goalPoint = pointOnField(world.size, owner.team === Team.Blue ? 0.98 : 0.02, 0.5);
  kickBall(world, owner, goalPoint.x, goalPoint.y, 405, false, { intent: KickIntent.Shot });
  const note = Status.shot(owner.name);
  setStatus(world, note.title, note.text);
}

/** Ticks the wind-up (ball stays glued to the foot), blasts the goal at contact, then releases. */
export function updatePowerShot(world: RealGkWorld, player: RealGkPlayer, dt: number): boolean {
  if (player.action !== PlayerAction.PowerShot) return false;
  const timing = shotTiming(player.mode);
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.actionElapsed += dt;
  const t = clamp(player.actionElapsed / timing.dur, 0, 1);
  player.vx = 0;
  player.vy = 0;
  if (!player.powerShotHit && t >= timing.contact) {
    player.powerShotHit = true;
    const goalPoint = goalPointFor(world, player);
    kickBall(world, player, goalPoint.x, goalPoint.y, SHOT_POWER, false, { intent: KickIntent.Shot });
    const note = Status.powerShot(player.name);
    setStatus(world, note.title, note.text);
  }
  if (player.actionTimer <= 0) {
    player.action = PlayerAction.None;
    player.mode = player.idleMode;
    player.modeLock = 0;
    return false;
  }
  return true;
}
