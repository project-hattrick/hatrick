import { BodyAnim, PlayerAction, Team } from '../enums';
import { pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { kickBall } from './ball';
import { Status } from './messages';
import { setStatus } from './rules';

/** Power-shot timing/shape (ported from the power_shot_free_area playground). */
const SHOT_DURATION = 0.52;
/** Heavy contact lands on frame 3 (~54% through the wind-up). */
const CONTACT_T = 0.54;
const SHOT_POWER = 470;

/** The ball owner winds up a power shot; the actual strike fires at the contact frame. */
export function startPowerShot(player: RealGkPlayer): boolean {
  player.action = PlayerAction.PowerShot;
  player.actionTimer = SHOT_DURATION;
  player.actionElapsed = 0;
  player.mode = BodyAnim.PowerShotFront;
  player.modeLock = SHOT_DURATION;
  player.idleMode = BodyAnim.IdleFront;
  player.powerShotHit = false;
  player.vx = 0;
  player.vy = 0;
  return true;
}

/** Ticks the wind-up (ball stays glued to the foot), blasts the goal at contact, then releases. */
export function updatePowerShot(world: RealGkWorld, player: RealGkPlayer, dt: number): boolean {
  if (player.action !== PlayerAction.PowerShot) return false;
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.actionElapsed += dt;
  const t = clamp(player.actionElapsed / SHOT_DURATION, 0, 1);
  player.vx = 0;
  player.vy = 0;
  if (!player.powerShotHit && t >= CONTACT_T) {
    player.powerShotHit = true;
    const goalPoint = pointOnField(world.size, player.team === Team.Blue ? 0.99 : 0.01, 0.5);
    kickBall(world, player, goalPoint.x, goalPoint.y, SHOT_POWER, false);
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
