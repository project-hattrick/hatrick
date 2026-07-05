import { BodyAnim, CelebrationPhase, KickIntent, PlayerAction, Role, Team } from '../enums';
import { pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { kickBall } from './ball';
import { Status } from './messages';
import { setStatus } from './rules';

/** Header timing/shape (ported from the header_free_area playground). */
const HEADER_DURATION = 0.5;
const HEADER_LIFT = 20;
const HEADER_COOLDOWN = 1.2;
/** Contact fires just past the apex (frame 3 = closed-mouth nod). */
const CONTACT_T = 0.52;

/** Airborne-ball window + reach that lets an outfield player jump to head it. */
const HEADER_MIN_Z = 22;
const HEADER_MAX_Z = 78;
const HEADER_REACH_X = 24;
const HEADER_REACH_Y = 22;

/** Begins the header action (holds position, plays the 4-frame nod once). */
export function startHeader(player: RealGkPlayer): boolean {
  player.action = PlayerAction.Header;
  player.actionTimer = HEADER_DURATION;
  player.actionElapsed = 0;
  player.mode = BodyAnim.HeaderFront;
  player.modeLock = HEADER_DURATION;
  player.idleMode = BodyAnim.IdleFront;
  player.headerHit = false;
  player.vx = 0;
  player.vy = 0;
  return true;
}

/** Nods the ball toward the attacking goal at the contact frame (Blue attacks lat 0.98, Red 0.02). */
function headerContact(world: RealGkWorld, player: RealGkPlayer): void {
  const goalPoint = pointOnField(world.size, player.team === Team.Blue ? 0.98 : 0.02, 0.5);
  kickBall(world, player, goalPoint.x, goalPoint.y, 360, false, { intent: KickIntent.Header });
  const note = Status.shot(player.name);
  setStatus(world, note.title, note.text);
}

/** Fires a header when a reachable airborne ball floats into a non-keeper's zone (v4 only). */
export function maybeTriggerHeader(world: RealGkWorld, player: RealGkPlayer): boolean {
  if (!world.cfg.features?.extraAnims || player.role === Role.GK) return false;
  const { ball } = world;
  if (ball.ownerId !== null || ball.cooldown > 0) return false;
  if (player.action !== PlayerAction.None || player.actionTimer > 0 || player.headerCooldown > 0) return false;
  if (player.celebrationPhase !== CelebrationPhase.None) return false;
  if (ball.z < HEADER_MIN_Z || ball.z > HEADER_MAX_Z) return false;
  if (Math.abs(ball.x - player.x) > HEADER_REACH_X || Math.abs(ball.y - player.y) > HEADER_REACH_Y) return false;
  return startHeader(player);
}

/** Ticks an in-progress header: jump lift, contact nod, then release. Returns false on the finishing tick. */
export function updateHeader(world: RealGkWorld, player: RealGkPlayer, dt: number): boolean {
  if (player.action !== PlayerAction.Header) return false;
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.actionElapsed += dt;
  const t = clamp(player.actionElapsed / HEADER_DURATION, 0, 1);
  // Reuse the celebration lift channel (grounded shadow + lifted sprite) for the jump.
  player.celebrationLift = Math.sin(t * Math.PI) * HEADER_LIFT;
  player.vx = 0;
  player.vy = 0;
  if (!player.headerHit && t >= CONTACT_T) {
    player.headerHit = true;
    headerContact(world, player);
  }
  if (player.actionTimer <= 0) {
    player.action = PlayerAction.None;
    player.mode = player.idleMode;
    player.modeLock = 0;
    player.celebrationLift = 0;
    player.headerCooldown = HEADER_COOLDOWN;
    return false;
  }
  return true;
}
