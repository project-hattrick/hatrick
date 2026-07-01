import { FIELD, PITCH } from '../core/constants';
import type { World } from '../core/types';
import { Role, Team } from '../enums';
import { clamp, dist } from '../math/geometry';
import { MatchEvent } from './events';
import { goal, setEvent } from './rules';

const FW = FIELD.width;
const FH = FIELD.height;

/** Advance players by velocity, clamp to pitch, accumulate locomotion phase. */
export function integratePlayers(world: World): void {
  for (const p of world.players) {
    p.x = clamp(p.x + p.vx, p.r, FW - p.r);
    p.y = clamp(p.y + p.vy, p.r, FH - p.r);
    p.phase += Math.hypot(p.vx, p.vy);
  }
}

/** Soft body separation so players don't overlap (more spacing between teammates). */
export function separatePlayers(world: World): void {
  const { players } = world;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      const d = dist(a, b);
      const space = a.team === b.team ? 13 : 4;
      const mn = a.r + b.r + space;
      if (d > 0 && d < mn) {
        const nx = (b.x - a.x) / d;
        const ny = (b.y - a.y) / d;
        const o = (mn - d) * 0.34;
        a.x -= nx * o;
        a.y -= ny * o;
        b.x += nx * o;
        b.y += ny * o;
      }
    }
  }
}

/** A nearby opponent occasionally knocks the ball loose (no teleport, cooldown-gated). */
export function contestBall(world: World): void {
  const dono = world.holder;
  if (!dono || dono.role === Role.GK) return;
  let rival = null;
  let rd = Infinity;
  for (const q of world.players) {
    if (q.team === dono.team || q.role === Role.GK) continue;
    const d = dist(q, dono);
    if (d < rd) {
      rd = d;
      rival = q;
    }
  }
  if (rival && rd < dono.r + rival.r + 4 && world.tick > world.ballContestCd) {
    world.ballContestCd = world.tick + 26;
    if (Math.random() < 0.5) {
      const { ball } = world;
      const dx = ball.x - rival.x;
      const dy = ball.y - rival.y;
      const m = Math.hypot(dx, dy) || 1;
      ball.vx = (dx / m) * 5 + (Math.random() * 2 - 1) * 1.5;
      ball.vy = (dy / m) * 5 + (Math.random() * 2 - 1) * 1.5;
      ball.vz = 2;
      world.freeBall = 24;
      world.holder = null;
      setEvent(world, MatchEvent.LooseBall);
    }
  }
}

/** Glue the ball just ahead of the dribbler's facing while they hold possession. */
export function dribble(world: World): void {
  const dono = world.holder;
  if (!dono || world.freeBall !== 0) return;
  const { ball } = world;
  const f = Math.hypot(dono.faceX, dono.faceY) || 1;
  const lead = dono.r + 3;
  const tx = dono.x + (dono.faceX / f) * lead;
  const ty = dono.y + (dono.faceY / f) * lead;
  ball.x += (tx - ball.x) * 0.5;
  ball.y += (ty - ball.y) * 0.5;
  ball.vx = 0;
  ball.vy = 0;
  ball.z = 0;
  ball.vz = 0;
  ball.roll += Math.hypot(dono.vx, dono.vy) * 0.7;
}

/** Everyone (except the holder and locked actions) turns to face the ball. */
export function faceBall(world: World): void {
  const { ball, tick } = world;
  for (const p of world.players) {
    if (
      p.slideUntil > tick ||
      p.kickUntil > tick ||
      p.diveUntil > tick ||
      p.gkKickUntil > tick ||
      p.catchUntil > tick ||
      p === world.holder
    ) {
      continue;
    }
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    p.faceX = dx / d;
    p.faceY = dy / d;
  }
}

/** Ball flight (height + roll), loose-ball collisions, wall bounces, and goal detection. */
export function integrateBall(world: World): void {
  const { ball, players, tick } = world;

  ball.z += ball.vz;
  ball.vz -= 0.4;
  if (ball.z <= 0) {
    if (ball.vz < -1.5) ball.impact = tick + 5;
    ball.z = 0;
    ball.vz = -ball.vz * 0.28;
    if (Math.abs(ball.vz) < 1.0) ball.vz = 0;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.vx *= 0.975;
  ball.vy *= 0.975;
  ball.roll += Math.hypot(ball.vx, ball.vy) * 0.7;

  if (world.freeBall > 0 && ball.z < 16) {
    for (const p of players) {
      const d = dist(p, ball);
      if (d > 0 && d < p.r + ball.r) {
        const nx = (ball.x - p.x) / d;
        const ny = (ball.y - p.y) / d;
        ball.x = p.x + nx * (p.r + ball.r);
        ball.y = p.y + ny * (p.r + ball.r);
        ball.vx = ball.vx * 0.3 + nx * 1.2;
        ball.vy = ball.vy * 0.3 + ny * 1.2;
      }
    }
  }

  if (ball.y < ball.r) {
    ball.y = ball.r;
    ball.vy *= -0.7;
  }
  if (ball.y > FH - ball.r) {
    ball.y = FH - ball.r;
    ball.vy *= -0.7;
  }

  const onGoalLine = ball.y > PITCH.goalY0 && ball.y < PITCH.goalY1;
  if (ball.x < ball.r) {
    if (onGoalLine) goal(world, Team.Red);
    else {
      ball.x = ball.r;
      ball.vx *= -0.7;
    }
  }
  if (ball.x > FW - ball.r) {
    if (onGoalLine) goal(world, Team.Blue);
    else {
      ball.x = FW - ball.r;
      ball.vx *= -0.7;
    }
  }
}
