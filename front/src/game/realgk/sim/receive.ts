import { BodyAnim, CelebrationPhase, PlayerAction, Role } from '../enums';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { BallText, Status } from './messages';
import { setStatus } from './rules';

/** First-touch timing/shape (ported from the receive_free_area playground). */
const RECEIVE_DURATION = 0.54;
const RECEIVE_COOLDOWN = 1.0;
/** Contact lands on frame 2 (~38% through the gesture) — the trap moment. */
const CONTACT_T = 0.38;

/** A fast loose ground ball rolling into a non-keeper's zone gets a first-touch trap. */
const RECEIVE_MAX_Z = 16;
const RECEIVE_MIN_SPEED = 120;
const RECEIVE_REACH_X = 40;
const RECEIVE_REACH_Y = 22;

/**
 * Begins the ground-ball settle. `steal` (cutting an opponent's pass) plays the intercept sprite;
 * otherwise it's a first-touch trap of your own team's pass. Both end in possession — same PlayerAction.
 */
export function startReceive(world: RealGkWorld, player: RealGkPlayer, steal: boolean): boolean {
  player.action = PlayerAction.Receive;
  player.actionTimer = RECEIVE_DURATION;
  player.actionElapsed = 0;
  player.mode = steal ? BodyAnim.InterceptFront : BodyAnim.ReceiveFront;
  player.modeLock = RECEIVE_DURATION;
  player.idleMode = BodyAnim.IdleFront;
  player.receiveHit = false;
  player.vx = 0;
  player.vy = 0;
  // Block a plain claim until the contact frame so the ball keeps rolling into the gesture.
  world.ball.cooldown = Math.max(world.ball.cooldown, RECEIVE_DURATION * CONTACT_T + 0.05);
  return true;
}

/** Fires a trap when a reachable, fast, incoming ground ball rolls at a non-keeper (v4 only). */
export function maybeTriggerReceive(world: RealGkWorld, player: RealGkPlayer): boolean {
  if (!world.cfg.features?.extraAnims || player.role === Role.GK) return false;
  const { ball } = world;
  if (ball.ownerId !== null || ball.cooldown > 0) return false;
  if (player.action !== PlayerAction.None || player.actionTimer > 0 || player.receiveCooldown > 0) return false;
  if (player.celebrationPhase !== CelebrationPhase.None) return false;
  if (ball.z > RECEIVE_MAX_Z) return false;
  if (Math.hypot(ball.vx, ball.vy) < RECEIVE_MIN_SPEED) return false;
  if (Math.abs(ball.x - player.x) > RECEIVE_REACH_X || Math.abs(ball.y - player.y) > RECEIVE_REACH_Y) return false;
  // Only if the ball is actually rolling toward the player.
  if ((player.x - ball.x) * ball.vx + (player.y - ball.y) * ball.vy <= 0) return false;
  // Steal if an opponent kicked it last (cutting their pass); trap if it's your own team's ball.
  const lastTeam = world.players.find((p) => p.id === ball.lastKickerId)?.team ?? null;
  const steal = lastTeam !== null && lastTeam !== player.team;
  // While feed-driven the feed dictates possession — allow own-team traps, suppress opponent intercepts
  // EXCEPT when the feed just granted this player's team the ball (the pass launched by the driver) or
  // drivenFiller keeps intercepts alive as between-events action.
  if (steal && world.driven && world.possessionGrant?.team !== player.team && world.cfg.features?.drivenFiller !== true) return false;
  return startReceive(world, player, steal);
}

/** Ticks an in-progress receive: hold, trap at contact (gains possession), then release. */
export function updateReceive(world: RealGkWorld, player: RealGkPlayer, dt: number): boolean {
  if (player.action !== PlayerAction.Receive) return false;
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.actionElapsed += dt;
  const t = clamp(player.actionElapsed / RECEIVE_DURATION, 0, 1);
  player.vx = 0;
  player.vy = 0;
  if (!player.receiveHit && t >= CONTACT_T) {
    player.receiveHit = true;
    const { ball } = world;
    ball.ownerId = player.id;
    ball.lastKickerId = player.id;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 0;
    ball.impact = 0.06;
    world.match.ballText = BallText.wins(player.name);
    const note = player.mode === BodyAnim.InterceptFront ? Status.intercept(player.name) : Status.trap(player.name);
    setStatus(world, note.title, note.text);
  }
  if (player.actionTimer <= 0) {
    player.action = PlayerAction.None;
    player.mode = player.idleMode;
    player.modeLock = 0;
    player.receiveCooldown = RECEIVE_COOLDOWN;
    return false;
  }
  return true;
}
