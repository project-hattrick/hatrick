import { BodyAnim, KickIntent, PlayerAction, Role, Team } from '../enums';
import { fieldBounds, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { ballOwner, kickBall } from './ball';
import { startPowerShot } from './shot';

const CONTROL_SPEED = 168;

/** Drives the keyboard-controlled player: move by held keys, pick a body mode from velocity. */
export function updateControlledPlayer(world: RealGkWorld, player: RealGkPlayer, dt: number): void {
  const c = world.control;
  let dx = c ? (c.right ? 1 : 0) - (c.left ? 1 : 0) : 0;
  let dy = c ? (c.down ? 1 : 0) - (c.up ? 1 : 0) : 0;
  const len = Math.hypot(dx, dy);
  if (len > 0) {
    dx /= len;
    dy /= len;
    player.vx += (dx * CONTROL_SPEED - player.vx) * Math.min(1, dt * 10);
    player.vy += (dy * CONTROL_SPEED - player.vy) * Math.min(1, dt * 10);
    player.lookX = dx;
    player.lookY = dy;
    player.desiredLookX = dx;
    player.desiredLookY = dy;
    if (dx < -0.15) player.facing = -1;
    else if (dx > 0.15) player.facing = 1;
  } else {
    player.vx *= Math.pow(0.35, dt * 60);
    player.vy *= Math.pow(0.35, dt * 60);
  }

  player.x += player.vx * dt;
  player.y += player.vy * dt;
  const b = fieldBounds(world.size, player.y);
  player.y = clamp(player.y, b.topY + 4, b.bottomY - 8);
  player.x = clamp(player.x, b.left + 12, b.right - 12);

  // Body mode straight from velocity (inline to avoid importing the AI module).
  const spd = Math.hypot(player.vx, player.vy);
  if (Math.abs(player.vy) > 18) player.idleMode = player.vy < 0 ? BodyAnim.IdleBack : BodyAnim.IdleFront;
  player.modeLock = Math.max(0, player.modeLock - dt);
  if (player.modeLock <= 0) {
    if (spd < 24) player.mode = player.idleMode;
    else if (Math.abs(player.vx) > Math.abs(player.vy) * 1.38 && Math.abs(player.vx) > 28) player.mode = BodyAnim.RunSide;
    else if (player.vy < 0) player.mode = spd > 120 ? BodyAnim.RunBack : BodyAnim.WalkBack;
    else player.mode = spd > 120 ? BodyAnim.RunFront : BodyAnim.WalkFront;
  }
}

/** Passes to the other same-team outfielder (control then follows the ball to them). */
export function controlPass(world: RealGkWorld): void {
  const owner = ballOwner(world);
  if (!owner) return;
  const mate = world.players.find((p) => p.team === owner.team && p.id !== owner.id && p.role !== Role.GK);
  if (!mate) return;
  kickBall(world, owner, mate.x, mate.y, 250, false);
}

/** Shoots at the attacking goal — animated power shot when v4 anims are on, else an instant strike. */
export function controlShoot(world: RealGkWorld): void {
  const owner = ballOwner(world);
  if (!owner) return;
  if (world.cfg.features?.extraAnims) {
    startPowerShot(owner);
    return;
  }
  const g = pointOnField(world.size, owner.team === Team.Blue ? 0.99 : 0.01, 0.5);
  kickBall(world, owner, g.x, g.y, 460, false, { intent: KickIntent.Shot });
}

/** Whether this player is the one under keyboard control right now (control follows possession). */
export function isControlled(world: RealGkWorld, player: RealGkPlayer): boolean {
  return world.cfg.features?.playable === true && player.id === world.controlId && player.action === PlayerAction.None;
}
