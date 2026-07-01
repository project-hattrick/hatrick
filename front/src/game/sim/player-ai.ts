import { animDuration } from '../assets/animation';
import { OUTFIELD_SPECS } from '../assets/manifest';
import { FIELD, PITCH } from '../core/constants';
import type { Player, World } from '../core/types';
import { OutfieldAnim, Role, Team } from '../enums';
import { clamp, dist, moveTo, nearestOppDist } from '../math/geometry';
import { MatchEvent } from './events';
import { kick, setEvent } from './rules';
import { dirOf, goalX, ownX } from './teams';

const TACKLE_DUR = animDuration(OUTFIELD_SPECS[OutfieldAnim.Tackle]);
const FW = FIELD.width;
const FH = FIELD.height;

/** Off-ball positioning weights, by role (data instead of branching). */
const FORWARD_BIAS: Record<Role, number> = { [Role.GK]: 0.3, [Role.DEF]: 0.22, [Role.MID]: 0.34, [Role.FWD]: 0.3 };
const ATTACK_PUSH: Record<Role, number> = { [Role.GK]: 0.04, [Role.DEF]: 0.04, [Role.MID]: 0.12, [Role.FWD]: 0.22 };
const DEFEND_PUSH: Record<Role, number> = { [Role.GK]: 0.05, [Role.DEF]: 0.1, [Role.MID]: 0.05, [Role.FWD]: 0.05 };

/** Outfield behaviour: tackle, on-ball decisions (shoot/cross/pass/dribble), chase, off-ball shape. */
export function outfieldStep(p: Player, world: World, chaser: Record<Team, Player | null>): void {
  const { ball, tick } = world;
  const dono = world.holder;
  const gx = goalX(p.team);

  if (p.slideUntil > tick) {
    p.vx *= 0.9;
    p.vy *= 0.9;
    return;
  }

  const defend = !(dono && dono.team === p.team);
  if (defend && dono !== p && tick > p.slideCd && dist(p, ball) < 30 && Math.random() < 0.025) {
    p.slideUntil = tick + TACKLE_DUR;
    p.slideStart = tick;
    p.slideCd = tick + 130;
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    p.vx = (dx / d) * 5.2;
    p.vy = (dy / d) * 5.2;
    p.faceX = dx / d;
    p.faceY = dy / d;
    setEvent(world, MatchEvent.SlideTackle);
    return;
  }

  if (dono === p) {
    onBall(p, world, gx);
    return;
  }
  if (chaser[p.team] === p) {
    moveTo(p, ball.x, ball.y, 2.2 * p.spdK);
    return;
  }
  offBall(p, world);
}

/** Decisions while owning the ball: shoot, cross, pass, or carry toward goal. */
function onBall(p: Player, world: World, gx: number): void {
  const { players, ball, tick } = world;
  const settling = tick < p.ponderUntil;

  if (!settling && Math.abs(gx - p.x) < 120 && Math.abs(p.y - FH / 2) < 110) {
    kick(world, gx - ball.x, FH / 2 + (Math.random() * 2 - 1) * PITCH.goalWidth * 0.42 - ball.y, 6.0, false, p);
    setEvent(world, MatchEvent.Shot);
    return;
  }

  world.think--;
  const advanced = dirOf(p.team) * (p.x - FW / 2) > FW * 0.16;
  const wide = p.y < FH * 0.26 || p.y > FH * 0.74;
  if (!settling && advanced && wide && world.think <= 0 && Math.random() < 0.5) {
    const tx = gx - dirOf(p.team) * 70;
    const ty = FH / 2 + (Math.random() * 2 - 1) * 45;
    kick(world, tx - ball.x, ty - ball.y, 6.4, true, p);
    world.think = 30 + Math.random() * 16;
    setEvent(world, MatchEvent.Cross);
    return;
  }

  let best: Player | null = null;
  let bs = -Infinity;
  for (const t of players) {
    if (t === p || t.team !== p.team || t.role === Role.GK) continue;
    const prog = dirOf(p.team) * (t.x - p.x);
    if (prog < 14) continue;
    const open = nearestOppDist(players, t);
    if (open < 24) continue;
    const sc = prog + open * 0.6 - dist(p, t) * 0.15;
    if (sc > bs) {
      bs = sc;
      best = t;
    }
  }
  if (best && world.think <= 0 && (nearestOppDist(players, p) < 60 || Math.random() < 0.06)) {
    kick(world, best.x - ball.x, best.y - ball.y, clamp(dist(p, best) * 0.05, 3.2, 5.6), false, p);
    world.think = 14 + Math.random() * 12;
    setEvent(world, MatchEvent.Pass);
    return;
  }
  moveTo(p, gx, clamp(p.y + (FH / 2 - p.y) * 0.02, FH * 0.12, FH * 0.88), settling ? 0.9 : 1.9);
}

/** Off-ball shape: defenders mark, everyone else holds a ball-biased home position. */
function offBall(p: Player, world: World): void {
  const { players, ball, tick } = world;
  const dono = world.holder;
  const attacking = !!dono && dono.team === p.team;
  const adv = dirOf(p.team);
  const wob = Math.sin(tick * p.wsp + p.wob);

  if (p.role === Role.DEF && !attacking) {
    let mark: Player | null = null;
    let md = Infinity;
    for (const q of players) {
      if (q.team === p.team || q.role === Role.GK) continue;
      const dd = Math.abs(q.y - p.homeY) + Math.abs(q.x - p.x) * 0.45;
      if (dd < md) {
        md = dd;
        mark = q;
      }
    }
    if (mark) {
      const guard = ownX(p.team) + adv * 40;
      const tx = clamp(mark.x + adv * -26, Math.min(guard, FW * 0.5), Math.max(guard, FW * 0.5));
      const ty = clamp(mark.y + p.lane * 6, 18, FH - 18);
      moveTo(p, tx, ty, 2.0 * p.spdK);
    } else {
      moveTo(p, p.homeX, p.homeY, 1.5 * p.spdK);
    }
    return;
  }

  const fwY = FORWARD_BIAS[p.role];
  const pushX = attacking ? adv * FW * ATTACK_PUSH[p.role] : adv * -FW * DEFEND_PUSH[p.role];
  const tx = clamp(p.homeX + pushX + (ball.x - FW / 2) * 0.12 * p.aggr + wob * 10, 24, FW - 24);
  const ty = clamp(p.homeY + (ball.y - p.homeY) * fwY + p.lane * 20 + wob * 8, 20, FH - 20);
  moveTo(p, tx, ty, 1.7 * p.spdK);
}
