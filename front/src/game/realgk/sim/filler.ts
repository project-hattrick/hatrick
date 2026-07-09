import { Role, Team } from '../enums';
import type { RealGkWorld } from '../types';
import { Status } from './messages';
import { setStatus } from './rules';

/**
 * Feed-driven filler (`features.drivenFiller`): between real feed events a 90' watch would go dead —
 * driven mode suppresses every autonomous outcome. The filler re-allows harmless action (occasional
 * shots that get saved, slide tackles, intercepts) while goals/score stay strictly feed-authoritative:
 * a driven ball can NEVER cross the goal line by itself (see `parryDrivenMouth`).
 */

const SHOT_COOLDOWN_MIN = 12;
const SHOT_COOLDOWN_MAX = 20;

export const fillerOn = (world: RealGkWorld): boolean => world.driven && world.cfg.features?.drivenFiller === true;

/** Arms the initial shot cooldown so a fresh driven match doesn't open with an instant filler shot. */
export function armFiller(world: RealGkWorld): void {
  world.fillerShotCooldown = SHOT_COOLDOWN_MIN + Math.random() * (SHOT_COOLDOWN_MAX - SHOT_COOLDOWN_MIN);
}

/** Ticks the filler cooldowns (live play only). */
export function tickFiller(world: RealGkWorld, dt: number): void {
  if (world.fillerShotCooldown > 0) world.fillerShotCooldown -= dt;
}

/** Whether the ball owner may take a filler shot now — consuming the cooldown when granted. */
export function fillerShotAllowed(world: RealGkWorld): boolean {
  if (!fillerOn(world) || world.fillerShotCooldown > 0) return false;
  world.fillerShotCooldown = SHOT_COOLDOWN_MIN + Math.random() * (SHOT_COOLDOWN_MAX - SHOT_COOLDOWN_MIN);
  return true;
}

/**
 * Keeper/post parry for a DRIVEN ball about to cross the line inside the goal mouth: bounce it back
 * into play instead of letting it sail through (feed goals arrive via injectGoal only). `goalOwner`
 * is the team whose goal was hit; `dirX` points back toward the pitch (+1 at the left goal).
 */
export function parryDrivenMouth(world: RealGkWorld, goalOwner: Team, dirX: number, lineX: number): void {
  const { ball } = world;
  ball.x = lineX + dirX * 4;
  ball.vx = Math.abs(ball.vx) * 0.45 * dirX;
  ball.vy = ball.vy * 0.3 + (Math.random() - 0.5) * 160;
  ball.vz = 90;
  ball.z = Math.min(ball.z, 12);
  ball.impact = 0.09;
  ball.cooldown = 0.3;
  const keeper = world.players.find((p) => p.team === goalOwner && p.role === Role.GK);
  if (keeper) {
    keeper.saveCooldown = 0.65;
    const note = Status.save(keeper.name);
    setStatus(world, note.title, note.text);
  }
}
