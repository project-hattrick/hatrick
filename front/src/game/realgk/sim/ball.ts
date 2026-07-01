import { BALL_FRAME_COUNT, BALL_GRAVITY } from '../constants';
import { BodyAnim, PlayerAction, Role, Team } from '../enums';
import { fieldBounds } from '../field';
import type { Ball, RealGkPlayer, RealGkWorld, Vec2 } from '../types';
import { clamp, lerp } from '../util';
import { BallText, Status } from './messages';
import { goal, setStatus } from './rules';

export function forwardVector(player: RealGkPlayer): Vec2 {
  const len = Math.hypot(player.lookX, player.lookY) || 1;
  return { x: player.lookX / len, y: player.lookY / len };
}

export function ballOwner(world: RealGkWorld): RealGkPlayer | null {
  return world.players.find((p) => p.id === world.ball.ownerId) ?? null;
}

export function teamPlayers(world: RealGkWorld, team: Team): RealGkPlayer[] {
  return world.players.filter((p) => p.team === team);
}

/** Strikes the ball toward a target with curl + height (pass / shot / lob). */
export function kickBall(world: RealGkWorld, player: RealGkPlayer, targetX: number, targetY: number, power: number, lob: boolean): void {
  const { ball } = world;
  const dx = targetX - ball.x;
  const dy = targetY - ball.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const curlSeed = clamp((player.vx * ny - player.vy * nx) * 0.012, -1, 1);
  ball.ownerId = null;
  ball.cooldown = lob ? 0.42 : 0.26;
  ball.vx = nx * power;
  ball.vy = ny * power * 0.92;
  ball.vz = lob ? 300 : power > 340 ? 92 : 46;
  ball.spin = (ball.spin + (lob ? 2.2 : 1.4)) % BALL_FRAME_COUNT;
  ball.spinRate = clamp((power / 115) * (lob ? 1.2 : 0.8) + curlSeed * 3.5, -9, 9);
  world.match.ballText = BallText.loose;
  const note = Status.kick(player.name, lob);
  setStatus(world, note.title, note.text);
}

/** A nearby player (or diving keeper) traps a loose ground ball. */
export function maybeClaimBall(world: RealGkWorld): void {
  const { ball, players } = world;
  if (ball.ownerId || ball.cooldown > 0 || ball.z > 18) return;
  let best: RealGkPlayer | null = null;
  let bestDist = Infinity;
  for (const player of players) {
    const reach = player.role === Role.GK ? (player.action === PlayerAction.Dive ? 44 : 34) : 28;
    const d = Math.hypot(player.x - ball.x, player.y - ball.y);
    if (d < reach && d < bestDist) {
      best = player;
      bestDist = d;
    }
  }
  if (!best) return;
  ball.ownerId = best.id;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  world.match.ballText = BallText.wins(best.name);
  if (best.role === Role.GK) {
    best.action = PlayerAction.None;
    best.actionTimer = 0;
    best.mode = BodyAnim.GkIdle;
    best.saveCooldown = 0.65;
    const note = Status.save(best.name);
    setStatus(world, note.title, note.text);
  }
}

/** Ball flight: glued to the owner's foot, else gravity + curl + drag + bounce + goal detection. */
export function updateBall(world: RealGkWorld, dt: number): void {
  const { ball, size } = world;
  const owner = ballOwner(world);

  ball.cooldown = Math.max(0, ball.cooldown - dt);
  ball.impact = Math.max(0, ball.impact - dt);

  if (owner) {
    const forward = forwardVector(owner);
    const footOffset = owner.role === Role.GK ? 10 : 16;
    const footX = owner.x + forward.x * footOffset;
    const footY = owner.role === Role.GK ? owner.y - 6 : owner.y + forward.y * 8 - (owner.mode.includes('back') ? 14 : 9);
    ball.x += (footX - ball.x) * 0.32;
    ball.y += (footY - ball.y) * 0.32;
    ball.z += (0 - ball.z) * 0.35;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 0;
    const ownerSpeed = Math.hypot(owner.vx, owner.vy);
    ball.spinRate += (ownerSpeed * 0.035 - ball.spinRate) * Math.min(1, dt * 9);
    ball.spin = (ball.spin + ball.spinRate * dt * 4 + BALL_FRAME_COUNT) % BALL_FRAME_COUNT;
    world.match.ballText = BallText.onBall(owner.name);
    return;
  }

  ball.ownerId = null;
  ball.vz -= BALL_GRAVITY * dt;

  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > 1) {
    const sideX = -ball.vy / speed;
    const sideY = ball.vx / speed;
    const curveStrength = (ball.z > 8 ? 5.8 : 2.2) * ball.spinRate;
    ball.vx += sideX * curveStrength * dt;
    ball.vy += sideY * curveStrength * dt;
  }

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.z += ball.vz * dt;

  const drag = ball.z > 8 ? 0.995 : ball.z > 2 ? 0.991 : 0.978;
  ball.vx *= Math.pow(drag, dt * 60);
  ball.vy *= Math.pow(drag, dt * 60);
  ball.spinRate *= Math.pow(ball.z > 1 ? 0.994 : 0.972, dt * 60);
  ball.spin = (ball.spin + ball.spinRate * dt * 5 + BALL_FRAME_COUNT) % BALL_FRAME_COUNT;

  if (ball.z <= 0) {
    if (ball.vz < -70) ball.impact = 0.09;
    ball.z = 0;
    ball.vz = -ball.vz * 0.42;
    ball.spinRate += clamp((ball.vx + ball.vy) * 0.0035, -1.3, 1.3);
    ball.vx *= 0.986;
    ball.vy *= 0.986;
    if (Math.abs(ball.vz) < 20) ball.vz = 0;
  }

  const bounds = fieldBounds(size, ball.y);
  const goalTop = lerp(bounds.topY, bounds.bottomY, 0.36);
  const goalBottom = lerp(bounds.topY, bounds.bottomY, 0.64);
  const inGoalMouth = ball.y >= goalTop && ball.y <= goalBottom && ball.z < 24;

  if (ball.y < bounds.topY + 4) {
    ball.y = bounds.topY + 4;
    ball.vy *= -0.66;
    ball.impact = 0.08;
  }
  if (ball.y > bounds.bottomY - 4) {
    ball.y = bounds.bottomY - 4;
    ball.vy *= -0.66;
    ball.impact = 0.08;
  }

  if (ball.x < bounds.left + 6) {
    if (inGoalMouth) {
      goal(world, Team.Red);
      return;
    }
    ball.x = bounds.left + 6;
    ball.vx *= -0.7;
    ball.impact = 0.08;
  }

  if (ball.x > bounds.right - 6) {
    if (inGoalMouth) {
      goal(world, Team.Blue);
      return;
    }
    ball.x = bounds.right - 6;
    ball.vx *= -0.7;
    ball.impact = 0.08;
  }

  maybeClaimBall(world);
}

/** Picks a ball sprite by impact / height / speed band + spin sub-frame. */
export function ballFrameIndex(ball: Ball): number {
  const speed = Math.hypot(ball.vx, ball.vy);
  const spinIdx = ((Math.floor(ball.spin) % 5) + 5) % 5;
  if (ball.impact > 0.01) return 10 + spinIdx;
  if (ball.z > 26) return 15 + spinIdx;
  if (speed > 235) return 5 + spinIdx;
  if (speed > 70 || ball.z > 8) return 15 + spinIdx;
  return spinIdx;
}
