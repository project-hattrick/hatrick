import { Role, Team } from '../enums';
import { fieldRatios, pointOnField } from '../field';
import type { RealGkWorld } from '../types';
import { clamp } from '../util';
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
  // Real-match faithfulness: keep the rest of the filler liveliness but never fire a fake shot-on-goal.
  if (world.cfg.features?.noFillerShots) return false;
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
    const r = fieldRatios(world.size, ball.x, ball.y);
    const brace = pointOnField(world.size, goalOwner === Team.Blue ? 0.08 : 0.92, r.depth);
    keeper.x += (brace.x - keeper.x) * 0.55;
    keeper.y += (brace.y - keeper.y) * 0.55;
    keeper.saveCooldown = 0.65;
    const note = Status.save(keeper.name);
    setStatus(world, note.title, note.text);
  }
  world.players
    .filter((p) => p.team === goalOwner && p.role !== Role.GK)
    .sort((a, b) => Math.hypot(a.x - ball.x, a.y - ball.y) - Math.hypot(b.x - ball.x, b.y - ball.y))
    .slice(0, 3)
    .forEach((p, i) => {
      const laneDepth = clamp(fieldRatios(world.size, ball.x, ball.y).depth + (i - 1) * 0.08, 0.18, 0.78);
      const lane = pointOnField(world.size, goalOwner === Team.Blue ? 0.13 : 0.87, laneDepth);
      p.x += (lane.x - p.x) * 0.38;
      p.y += (lane.y - p.y) * 0.38;
    });
}
