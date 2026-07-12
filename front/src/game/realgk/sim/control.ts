import { BodyAnim, KickIntent, PlayerAction, Role, Team } from '../enums';
import { spawnFootDust } from '../effects';
import { fieldBounds, fieldRatios, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { ballOwner, kickBall } from './ball';
import { commitControlledMode, keeperThreatened, startPuntWindup } from './feel';
import { startPowerShot } from './shot';

const CONTROL_SPEED = 168;

/**
 * Feel-comparison grid autopilot: steers the pinned keeper along its goal line tracking the ball, and
 * punts a caught ball back upfield. Reuses `world.control` so `updateControlledPlayer` (with all the feel
 * hooks) drives the body — the dive itself is triggered like an AI keeper in updatePlayers. Only runs when
 * `cfg.keeperAutopilot` is set (the /sandbox/france-feel grid); the normal manual GK sandbox is untouched.
 */
export function updateKeeperAutopilot(world: RealGkWorld): void {
  const c = world.control;
  if (!c) return;
  const gk = world.players.find((p) => p.id === world.controlId && p.role === Role.GK);
  if (!gk) {
    c.up = c.down = c.left = c.right = false;
    return;
  }
  const { ball, size } = world;

  // Punt the caught ball upfield shortly after a save (exercises feel.puntWindup end-to-end).
  if (ball.ownerId === gk.id && gk.saveCooldown > 0 && gk.saveCooldown < 0.45) controlShoot(world);

  // Hold the line, tracking the ball's depth; a small lateral follow surfaces run-side / lean / skid.
  const r = fieldRatios(size, ball.x, ball.y);
  const blue = gk.team === Team.Blue;
  const targetLat = blue ? clamp(0.055 + r.lat * 0.07, 0.045, 0.17) : clamp(0.945 - (1 - r.lat) * 0.07, 0.83, 0.955);
  const target = pointOnField(size, targetLat, clamp(r.depth, 0.33, 0.67));
  // A generous dead-zone: without it the keeper overshoots the target every frame and the mode flickers
  // idle⇄shuffle⇄run each tick, which reads as "super fast / buggy" jitter.
  const dz = 16;
  c.left = target.x < gk.x - dz;
  c.right = target.x > gk.x + dz;
  c.up = target.y < gk.y - dz;
  c.down = target.y > gk.y + dz;
}

/** Drives the keyboard-controlled player: move by held keys, pick a body mode from velocity. */
export function updateControlledPlayer(world: RealGkWorld, player: RealGkPlayer, dt: number): void {
  const c = world.control;
  let dx = c ? (c.right ? 1 : 0) - (c.left ? 1 : 0) : 0;
  let dy = c ? (c.down ? 1 : 0) - (c.up ? 1 : 0) : 0;
  const len = Math.hypot(dx, dy);
  const facingBefore = player.facing;
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
  if (player.role === Role.GK) {
    // The AI path decays this in moveToward; the controlled keeper must decay it here or a
    // finished dive would lock him out of the next one forever.
    player.saveCooldown = Math.max(0, player.saveCooldown - dt);
    player.idleMode = BodyAnim.GkIdle;
    player.modeLock = Math.max(0, player.modeLock - dt);
    const fs = player.feel;
    // feel.puntWindup / diveRecovery own the pose: hold GkReady through the crouch/rise so the body
    // never snaps between an action and the standing frame.
    if (fs.punt > 0 || (world.feel.diveRecovery && fs.recover > 0)) {
      player.mode = BodyAnim.GkReady;
      return;
    }
    // Skid dust on a hard left/right reversal (masks the abrupt velocity cut).
    if (world.feel.skidDust && player.facing !== facingBefore && Math.abs(player.vx) > 60) {
      spawnFootDust(world, player.x, player.y, Math.abs(player.vx), player.facing);
    }
    if (player.modeLock <= 0) {
      let desired: BodyAnim;
      if (spd < 24) {
        // idleLife: hold the animated ready crouch when a shot threatens, else the plain idle.
        desired = world.feel.idleLife && keeperThreatened(world, player) ? BodyAnim.GkReady : BodyAnim.GkIdle;
      } else if (Math.abs(player.vx) > Math.abs(player.vy) * 1.18 && Math.abs(player.vx) > 18) {
        desired = BodyAnim.GkRunSide;
      } else {
        desired = BodyAnim.GkShuffle;
      }
      commitControlledMode(player, desired, dt, world.feel.modeHold);
    }
    return;
  }
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
  if (owner.role === Role.GK) {
    // Keeper clear: a long lofted punt upfield — the outfield power-shot body doesn't fit the GK kit.
    const target = pointOnField(world.size, owner.team === Team.Blue ? 0.72 : 0.28, 0.3 + Math.random() * 0.4);
    // feel.puntWindup plays a crouch anticipation, then updateFeel fires the kick at contact.
    if (world.feel.puntWindup) startPuntWindup(world, owner, target.x, target.y);
    else kickBall(world, owner, target.x, target.y, 400, true);
    return;
  }
  if (world.cfg.features?.extraAnims || world.cfg.features?.personaShot) {
    startPowerShot(world, owner, world.cfg.features?.personaHeads === true);
    return;
  }
  const g = pointOnField(world.size, owner.team === Team.Blue ? 0.99 : 0.01, 0.5);
  kickBall(world, owner, g.x, g.y, 460, false, { intent: KickIntent.Shot });
}

/** Whether this player is the one under keyboard control right now (control follows possession). */
export function isControlled(world: RealGkWorld, player: RealGkPlayer): boolean {
  return world.cfg.features?.playable === true && player.id === world.controlId && player.action === PlayerAction.None;
}
