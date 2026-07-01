import { CoachMode } from '../enums';
import { fieldBounds, pointOnField } from '../field';
import type { Coach, RealGkWorld } from '../types';

export const freshCoach = (): Coach => ({
  x: 0,
  y: 0,
  depth: 0.82,
  mode: CoachMode.Idle,
  timer: 0,
  cooldown: 1.6,
  angryDuration: 1.15,
});

/** Plants the coach just off the left touchline near the bench. */
export function resetCoach(world: RealGkWorld): void {
  const anchor = pointOnField(world.size, 0.04, 0.82);
  const bounds = fieldBounds(world.size, anchor.y);
  const c = world.coach;
  c.x = bounds.left - 18;
  c.y = anchor.y + 8;
  c.depth = bounds.depth;
  c.mode = CoachMode.Idle;
  c.timer = 0;
  c.cooldown = 1.4 + Math.random() * 1.6;
}

/** Flips to "angry" during intense play near the bench, then cools back to idle. */
export function updateCoach(world: RealGkWorld, dt: number): void {
  const c = world.coach;
  const { ball, match, size } = world;
  c.timer += dt;
  c.cooldown = Math.max(0, c.cooldown - dt);

  if (c.mode === CoachMode.Angry) {
    if (c.timer >= c.angryDuration) {
      c.mode = CoachMode.Idle;
      c.timer = 0;
      c.cooldown = 2.6 + Math.random() * 2.4;
    }
    return;
  }

  const ballNearBench = ball.x < size.width * 0.46 && Math.abs(ball.y - c.y) < 235;
  const intensePlay = Math.hypot(ball.vx, ball.vy) > 155 || match.celebration > 0;
  if (c.cooldown <= 0 && ballNearBench && intensePlay) {
    c.mode = CoachMode.Angry;
    c.timer = 0;
  }
}
