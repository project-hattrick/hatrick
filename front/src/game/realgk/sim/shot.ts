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

/**
 * The ball owner winds up a power shot; the actual strike fires at the contact frame. The view follows
 * the striker's orientation: profile (side) toward the goal by default, back if running away, front if
 * facing the camera.
 */
export function startPowerShot(player: RealGkPlayer): boolean {
  let mode = BodyAnim.PowerShotSide;
  let idle = player.idleMode;
  if (player.lookY < -0.45 || player.idleMode === BodyAnim.IdleBack) {
    mode = BodyAnim.PowerShotBack;
    idle = BodyAnim.IdleBack;
  } else if (player.lookY > 0.45) {
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
    const goalPoint = pointOnField(world.size, player.team === Team.Blue ? 0.99 : 0.01, 0.5);
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
