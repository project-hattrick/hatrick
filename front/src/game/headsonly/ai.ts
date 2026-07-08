/**
 * Match AI for the heads-only sandbox: randomized on-ball decisions (pass-biased so the ball
 * pings around like a real game), lane-aware pass picking, keepers that guard/clear, and
 * off-ball runs that shift the team shape with possession.
 */
import {
  GOAL_BOTTOM,
  GOAL_TOP,
  TUNING,
  Team,
  clamp,
  facingFrom,
  len,
  rand,
  type GameState,
  type Player,
} from './types';

export enum DecisionKind {
  Pass = 'pass',
  Shoot = 'shoot',
  Dribble = 'dribble',
  Clear = 'clear',
}

export interface Decision {
  kind: DecisionKind;
  target?: Player;
  tx: number;
  ty: number;
}

export const isKeeper = (p: Player): boolean => p.jersey === 1;

/** +1 when the team attacks toward x=1 (Blue), -1 otherwise. */
export const attackSign = (team: Team): number => (team === Team.Blue ? 1 : -1);

export const goalXFor = (team: Team): number => (team === Team.Blue ? 1 : 0);

const keeperLineX = (team: Team): number => (team === Team.Blue ? 0.05 : 0.95);

export function moveToward(p: Player, tx: number, ty: number, speed: number, dt: number): void {
  const dx = tx - p.x;
  const dy = ty - p.y;
  const d = len(dx, dy);
  const nx = dx / d;
  const ny = dy / d;
  const step = Math.min(speed * dt, d);
  p.x += nx * step;
  p.y += ny * step;
  p.vx = nx * speed;
  p.vy = ny * speed;
  p.speed = d < 0.004 ? 0 : speed;
  const f = facingFrom(p.vx, p.vy, p);
  p.view = f.view;
  p.flip = f.flip;
}

function nearestOpponentDist(state: GameState, x: number, y: number, team: Team): number {
  let best = Number.POSITIVE_INFINITY;
  for (const q of state.players) {
    if (q.team === team) continue;
    const d = Math.hypot(q.x - x, q.y - y);
    if (d < best) best = d;
  }
  return best;
}

/** True when an opponent sits close to the passing lane between `from` and `to`. */
function laneBlocked(state: GameState, from: Player, to: Player): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d2 = dx * dx + dy * dy || 1;
  for (const q of state.players) {
    if (q.team === from.team) continue;
    const t = ((q.x - from.x) * dx + (q.y - from.y) * dy) / d2;
    if (t < 0.15 || t > 0.9) continue;
    const px = from.x + dx * t;
    const py = from.y + dy * t;
    if (Math.hypot(q.x - px, q.y - py) < 0.035) return true;
  }
  return false;
}

/** Best pass option: open, forward-leaning, mid-range, clear lane — with a random nudge. */
export function passTargetFor(state: GameState, p: Player): Player | null {
  const sign = attackSign(p.team);
  let best: Player | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const mate of state.players) {
    if (mate.team !== p.team || mate.id === p.id || isKeeper(mate)) continue;
    const d = Math.hypot(mate.x - p.x, mate.y - p.y);
    if (d < 0.06 || d > 0.5) continue;
    const openness = Math.min(nearestOpponentDist(state, mate.x, mate.y, p.team), 0.16);
    const progress = (mate.x - p.x) * sign;
    const sweet = d > 0.12 && d < 0.32 ? 0.25 : 0;
    let score = openness * 3 + progress * 1.4 + sweet + rand(0, 0.3);
    if (laneBlocked(state, p, mate)) score -= 0.9;
    if (score > bestScore) {
      bestScore = score;
      best = mate;
    }
  }
  return best;
}

/** One on-ball decision. Keepers always clear; outfielders weigh shoot / pass / dribble. */
export function ownerDecision(state: GameState, p: Player): Decision {
  const sign = attackSign(p.team);
  const gx = goalXFor(p.team);
  if (isKeeper(p)) {
    const target = passTargetFor(state, p);
    return {
      kind: DecisionKind.Clear,
      target: target ?? undefined,
      tx: clamp(p.x + sign * rand(0.3, 0.45), 0.1, 0.9),
      ty: rand(0.25, 0.75),
    };
  }
  // Feed threat for this player's team (0 when it isn't the attacking side).
  const drive = state.intent.attackingTeam === p.team ? state.intent.threat : 0;
  const distGoal = Math.hypot(gx - p.x, 0.5 - p.y);
  const inRange = Math.abs(gx - p.x) < 0.32 + drive * 0.14 && p.y > 0.14 && p.y < 0.86;
  if (inRange && Math.random() < clamp(0.9 - distGoal * 1.9, 0.15, 0.8) + drive * 0.3) {
    return { kind: DecisionKind.Shoot, tx: gx, ty: 0.5 };
  }
  const pressured = nearestOpponentDist(state, p.x, p.y, p.team) < 0.055;
  // Higher threat → commit forward more (fewer safe passes, longer carries).
  if (Math.random() < (pressured ? 0.85 : 0.62) - drive * 0.18) {
    const target = passTargetFor(state, p);
    if (target) return { kind: DecisionKind.Pass, target, tx: target.x, ty: target.y };
  }
  return {
    kind: DecisionKind.Dribble,
    tx: clamp(p.x + sign * rand(0.08, 0.18) * (1 + drive), 0.03, 0.97),
    ty: clamp(p.y + rand(-0.16, 0.16), 0.08, 0.92),
  };
}

/** Movement for every player not controlling the ball (and not user-controlled). */
export function updateOffBall(state: GameState, p: Player, isChaser: boolean, dt: number): void {
  const ball = state.ball;
  if (isKeeper(p)) {
    const ty = clamp(ball.y, GOAL_TOP + 0.02, GOAL_BOTTOM - 0.02);
    moveToward(p, keeperLineX(p.team), ty, TUNING.keeperSpeed, dt);
    return;
  }
  if (state.passTargetId === p.id && !ball.ownerId) {
    moveToward(p, ball.x + ball.vx * 0.18, ball.y + ball.vy * 0.18, TUNING.receiverSpeed, dt);
    return;
  }
  if (isChaser) {
    moveToward(p, ball.x, ball.y, TUNING.aiChaseSpeed, dt);
    return;
  }
  if (state.time >= p.runUntil) {
    p.runUntil = state.time + rand(1.6, 3.4);
    const owner = state.players.find((q) => q.id === ball.ownerId);
    const forward = owner?.team === p.team ? attackSign(p.team) * rand(0.02, 0.09) : 0;
    p.runX = rand(-0.04, 0.04) + forward;
    p.runY = rand(-0.05, 0.05);
  }
  // Mold the team shape to the feed: the attacking side pushes forward by threat,
  // the defending side drops deeper and squeezes toward the middle (defend the box).
  const intent = state.intent;
  let pushX = 0;
  let squeezeY = 0;
  if (intent.attackingTeam) {
    if (p.team === intent.attackingTeam) pushX = attackSign(p.team) * intent.threat * 0.16;
    else {
      pushX = -attackSign(p.team) * intent.threat * 0.1;
      squeezeY = (0.5 - p.homeY) * intent.threat * 0.28;
    }
  }
  const tx = clamp(p.homeX + (ball.x - 0.5) * 0.16 + p.runX + pushX, 0.03, 0.97);
  const ty = clamp(p.homeY + (ball.y - p.homeY) * 0.14 + p.runY + squeezeY, 0.07, 0.93);
  moveToward(p, tx, ty, TUNING.aiHoldSpeed, dt);
}
