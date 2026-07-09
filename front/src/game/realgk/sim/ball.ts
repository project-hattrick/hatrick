import { BALL_FRAME_COUNT, BALL_GRAVITY } from '../constants';
import { BodyAnim, KickIntent, PlayerAction, RestartKind, RestartStage, Role, Team } from '../enums';
import { spawnBallGroundImpact, spawnShotEffect, triggerShotSlowMo } from '../effects';
import { cornerSpot, fieldBounds, fieldRatios, goalKickSpot, pointOnField, throwInSpot, GOAL_MAX_Z, GOALS, PLAY_LINES } from '../field';
import type { Ball, BallKickOptions, RealGkWorld, RealGkPlayer, Vec2 } from '../types';
import { clamp, lerp } from '../util';
import { BallText, Status } from './messages';
import { parryDrivenMouth } from './filler';
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
export function kickBall(
  world: RealGkWorld,
  player: RealGkPlayer,
  targetX: number,
  targetY: number,
  power: number,
  lob: boolean,
  options: BallKickOptions = {},
): void {
  const { ball } = world;
  const dx = targetX - ball.x;
  const dy = targetY - ball.y;
  const len = Math.hypot(dx, dy) || 1;
  if (options.intent === KickIntent.Shot) {
    spawnShotEffect(world, dx, dy, power);
    triggerShotSlowMo(world);
  }
  const nx = dx / len;
  const ny = dy / len;
  const curlSeed = clamp((player.vx * ny - player.vy * nx) * 0.012, -1, 1);
  ball.ownerId = null;
  ball.lastKickerId = player.id;
  ball.lofted = lob; // only lofted balls (crosses / long balls) show the landing marker
  ball.cooldown = lob ? 0.42 : 0.26;
  ball.vx = nx * power;
  ball.vy = ny * power * 0.92;
  ball.vz = lob ? 300 : power > 340 ? 92 : 46;
  if (lob) {
    // Fix the landing marker once, at the cross (ballistic projection — it must not drift with the ball).
    const flight = (ball.vz + Math.sqrt(ball.vz * ball.vz + 2 * BALL_GRAVITY * Math.max(0, ball.z))) / BALL_GRAVITY;
    ball.landX = ball.x + ball.vx * flight;
    ball.landY = ball.y + ball.vy * flight;
  }
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
    // Possession-grant window (driven): the granted team wins the loose ball unless someone else is on top of it.
    if (world.possessionGrant && player.team !== world.possessionGrant.team && d > 14) continue;
    if (d < reach && d < bestDist) {
      best = player;
      bestDist = d;
    }
  }
  if (!best) return;
  ball.ownerId = best.id;
  ball.lofted = false;
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

const opposite = (t: Team): Team => (t === Team.Blue ? Team.Red : Team.Blue);

/** Places the ball as a dead ball at a pitch spot and names the restart (replaces the old wall bounce). */
function deadBall(world: RealGkWorld, lat: number, depth: number, note: { title: string; text: string }): void {
  const { ball, size } = world;
  const spot = pointOnField(size, lat, depth);
  ball.x = spot.x;
  ball.y = spot.y;
  ball.z = 0;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.spinRate = 0;
  ball.ownerId = null;
  ball.lastKickerId = null;
  ball.lofted = false;
  // Brief dead-ball window so it isn't snapped up instantly — the nearest player runs on and restarts.
  ball.cooldown = 0.5;
  world.match.ballText = BallText.deadBall;
  setStatus(world, note.title, note.text);
}

/** v5 deadBallSequence: flag the restart and let the ball keep rolling OUT — restart.ts then places it,
 *  walks the taker to the correct spot and puts it back in play. Legacy (gate off) snaps via `deadBall`. */
function beginRestart(world: RealGkWorld, kind: RestartKind, team: Team, spot: Vec2, note: { title: string; text: string }): void {
  world.match.restart = { kind, team, stage: RestartStage.BallOut, timer: 0, spot, takerId: null };
  world.match.ballText = BallText.deadBall;
  setStatus(world, note.title, note.text);
}

/** Ball over a touchline (top/bottom) → throw-in for the team that didn't touch it last. */
function throwInRestart(world: RealGkWorld, lastTeam: Team | null, topSide: boolean): void {
  const { ball, size } = world;
  const team = lastTeam ? opposite(lastTeam) : Team.Blue;
  if (world.cfg.features?.deadBallSequence) {
    beginRestart(world, RestartKind.ThrowIn, team, throwInSpot(size, ball.x, ball.y, topSide), Status.throwIn(team));
    return;
  }
  const lat = clamp(fieldRatios(size, ball.x, ball.y).lat, 0.06, 0.94);
  deadBall(world, lat, topSide ? 0.04 : 0.96, Status.throwIn(team));
}

/** Ball over a goal line (left/right, no goal) → corner (attacker last touched) or goal kick (defender). */
function bylineRestart(world: RealGkWorld, goalOwner: Team, lastTeam: Team | null): void {
  const { ball, size } = world;
  const attacker = opposite(goalOwner);
  // Which corner / goal-area side the ball crossed (top vs bottom half of the pitch).
  const top = fieldRatios(size, ball.x, ball.y).depth < 0.5;
  if (lastTeam === attacker) {
    if (world.cfg.features?.deadBallSequence) {
      beginRestart(world, RestartKind.Corner, attacker, cornerSpot(size, goalOwner, top), Status.corner(attacker));
      return;
    }
    const lat = goalOwner === Team.Blue ? 0.015 : 0.985;
    deadBall(world, lat, 0.94, Status.corner(attacker));
  } else {
    if (world.cfg.features?.deadBallSequence) {
      beginRestart(world, RestartKind.GoalKick, goalOwner, goalKickSpot(size, goalOwner, top), Status.goalKick(goalOwner));
      return;
    }
    const lat = goalOwner === Team.Blue ? 0.14 : 0.86; // just inside the defended goal
    deadBall(world, lat, 0.5, Status.goalKick(goalOwner));
  }
}

/** Loose-ball flight: gravity + curl + drag + ground bounce (NO out-of-play detection). Shared with restarts. */
export function integrateBallFlight(world: RealGkWorld, dt: number): void {
  const { ball } = world;
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
    const impactSpeed = Math.abs(Math.min(0, ball.vz));
    if (ball.vz < -70) ball.impact = 0.09;
    if (impactSpeed > 38) spawnBallGroundImpact(world, impactSpeed);
    ball.z = 0;
    ball.vz = -ball.vz * 0.42;
    ball.spinRate += clamp((ball.vx + ball.vy) * 0.0035, -1.3, 1.3);
    ball.vx *= 0.986;
    ball.vy *= 0.986;
    if (Math.abs(ball.vz) < 20) ball.vz = 0;
  }
}

/** Ball flight: glued to the owner's foot, else gravity + curl + drag + out-of-play restarts. */
export function updateBall(world: RealGkWorld, dt: number): void {
  const { ball, size } = world;
  const owner = ballOwner(world);

  ball.cooldown = Math.max(0, ball.cooldown - dt);
  ball.impact = Math.max(0, ball.impact - dt);

  if (owner) {
    ball.lofted = false;
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
  integrateBallFlight(world, dt);

  const bounds = fieldBounds(size, ball.y);
  // Per-side goal mouth (calibrated in field.ts GOALS). Blue defends the left, Red the right.
  const leftGoal = GOALS[Team.Blue];
  const rightGoal = GOALS[Team.Red];
  const inLeftMouth =
    ball.y >= lerp(bounds.topY, bounds.bottomY, leftGoal.depthTop) &&
    ball.y <= lerp(bounds.topY, bounds.bottomY, leftGoal.depthBottom) &&
    ball.z < GOAL_MAX_Z;
  const inRightMouth =
    ball.y >= lerp(bounds.topY, bounds.bottomY, rightGoal.depthTop) &&
    ball.y <= lerp(bounds.topY, bounds.bottomY, rightGoal.depthBottom) &&
    ball.z < GOAL_MAX_Z;

  const lastTeam = world.players.find((p) => p.id === ball.lastKickerId)?.team ?? null;

  // Out-of-play lines come from the calibrated PLAY_LINES ratios (not the raw trapezoid edges).
  const leftLineX = lerp(bounds.left, bounds.right, PLAY_LINES.latLeft);
  const rightLineX = lerp(bounds.left, bounds.right, PLAY_LINES.latRight);
  const topLineY = lerp(bounds.topY, bounds.bottomY, PLAY_LINES.depthTop);
  const bottomLineY = lerp(bounds.topY, bounds.bottomY, PLAY_LINES.depthBottom);

  // Feed-driven: a shot arriving at the goal is killed EARLY — keeper or post — a margin before the
  // line, over the mouth plus a post apron, so a miss can never sail into the goal area/net. Real
  // goals only via injectGoal (which runs the celebration flow, not this flight).
  if (world.driven) {
    const PARRY_MARGIN = 26;
    const leftTop = lerp(bounds.topY, bounds.bottomY, leftGoal.depthTop);
    const leftBottom = lerp(bounds.topY, bounds.bottomY, leftGoal.depthBottom);
    const rightTop = lerp(bounds.topY, bounds.bottomY, rightGoal.depthTop);
    const rightBottom = lerp(bounds.topY, bounds.bottomY, rightGoal.depthBottom);
    const apronL = (leftBottom - leftTop) * 0.3;
    const apronR = (rightBottom - rightTop) * 0.3;
    if (ball.vx < -60 && ball.x <= leftLineX + PARRY_MARGIN && ball.y >= leftTop - apronL && ball.y <= leftBottom + apronL && ball.z < GOAL_MAX_Z * 1.5) {
      parryDrivenMouth(world, Team.Blue, 1, leftLineX + PARRY_MARGIN);
      return;
    }
    if (ball.vx > 60 && ball.x >= rightLineX - PARRY_MARGIN && ball.y >= rightTop - apronR && ball.y <= rightBottom + apronR && ball.z < GOAL_MAX_Z * 1.5) {
      parryDrivenMouth(world, Team.Red, -1, rightLineX - PARRY_MARGIN);
      return;
    }
  }

  // Goal lines (left/right) take priority: goal in the mouth, else corner / goal kick.
  // While feed-driven, a ball in the mouth never self-scores — goals come only via injectGoal; the
  // keeper/post parries it back into play so the feed stays authoritative on the scoreline.
  if (ball.x < leftLineX) {
    if (inLeftMouth) {
      if (world.driven) {
        parryDrivenMouth(world, Team.Blue, 1, leftLineX);
        return;
      }
      goal(world, Team.Red);
      return;
    }
    bylineRestart(world, Team.Blue, lastTeam);
    return;
  }
  if (ball.x > rightLineX) {
    if (inRightMouth) {
      if (world.driven) {
        parryDrivenMouth(world, Team.Red, -1, rightLineX);
        return;
      }
      goal(world, Team.Blue);
      return;
    }
    bylineRestart(world, Team.Red, lastTeam);
    return;
  }
  // Touchlines (top/bottom) → throw-in.
  if (ball.y < topLineY) {
    throwInRestart(world, lastTeam, true);
    return;
  }
  if (ball.y > bottomLineY) {
    throwInRestart(world, lastTeam, false);
    return;
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
