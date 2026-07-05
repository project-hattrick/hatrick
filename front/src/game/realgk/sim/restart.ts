import { KickIntent, RefPhase, RestartKind, RestartStage, Role, Team } from '../enums';
import { GOALS, fieldRatios, goalCenterForTeam, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld, RestartState, Vec2 } from '../types';
import { clamp } from '../util';
import { integrateBallFlight, kickBall } from './ball';
import { updateCoach } from './coach';
import { holdFoulScene } from './foul';
import { Status } from './messages';
import { moveToward } from './players';
import { spawnRefereeFoul, updateReferee } from './referee';
import { setStatus } from './rules';
import { computeRestartTargets } from './setpiece';

/** How long the ball rolls off the pitch before it's placed at the restart spot. */
const BALL_OUT_SECONDS = 0.7;
/** Frozen beat at the foul before the referee starts his sprint. */
const FOUL_FREEZE_SECONDS = 0.9;
/** Cap on the referee's run-in + sanction so a stuck ref never blocks the restart. */
const REF_ARRIVE_MAX_SECONDS = 8;
/** Distance (px) at which the taker is close enough to strike the dead ball. */
const TAKE_REACH = 20;
/** Penalty run-up: how far behind the ball the taker stands, and his strike reach. */
const PENALTY_RUNUP = 46;
const PENALTY_STRIKE_REACH = 15;

/** Minimum staging time (others walk into position) and hard cap on the walk-over, per restart type. */
const SETUP_MIN: Record<RestartKind, number> = {
  [RestartKind.None]: 0.9,
  [RestartKind.ThrowIn]: 0.9,
  [RestartKind.Corner]: 2.6,
  [RestartKind.GoalKick]: 1.0,
  [RestartKind.FreeKick]: 1.5,
  [RestartKind.Penalty]: 1.6,
};
const SETUP_MAX: Record<RestartKind, number> = {
  [RestartKind.None]: 2.6,
  [RestartKind.ThrowIn]: 2.6,
  [RestartKind.Corner]: 4.6,
  [RestartKind.GoalKick]: 3.0,
  [RestartKind.FreeKick]: 3.8,
  [RestartKind.Penalty]: 4.6,
};
/** Broadcast hold once everyone is set (penalties instead run up at the ball, capped separately). */
const READY_HOLD: Record<RestartKind, number> = {
  [RestartKind.None]: 0.35,
  [RestartKind.ThrowIn]: 0.35,
  [RestartKind.Corner]: 0.6,
  [RestartKind.GoalKick]: 0.4,
  [RestartKind.FreeKick]: 0.75,
  [RestartKind.Penalty]: 3.0,
};

const opposite = (t: Team): Team => (t === Team.Blue ? Team.Red : Team.Blue);

const distTo = (p: { x: number; y: number }, s: Vec2): number => Math.hypot(p.x - s.x, p.y - s.y);

/** Restart taker per type: the keeper takes goal kicks, otherwise the nearest outfielder. */
function pickTaker(world: RealGkWorld, r: RestartState): RealGkPlayer | null {
  const roster = world.players.filter((p) => p.team === r.team);
  if (!roster.length) return null;
  if (r.kind === RestartKind.GoalKick) {
    const gk = roster.find((p) => p.role === Role.GK);
    if (gk) return gk;
  }
  const outfielders = roster.filter((p) => p.role !== Role.GK);
  const pool = outfielders.length ? outfielders : roster;
  return pool.reduce((best, p) => (distTo(p, r.spot) < distTo(best, r.spot) ? p : best));
}

/** Snaps the dead ball onto the restart spot and assigns the taker. */
function placeDeadBall(world: RealGkWorld, r: RestartState): void {
  const { ball } = world;
  ball.x = r.spot.x;
  ball.y = r.spot.y;
  ball.z = 0;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.spinRate = 0;
  ball.ownerId = null;
  ball.lastKickerId = null;
  ball.lofted = false;
  ball.cooldown = 0.5;
  r.takerId = pickTaker(world, r)?.id ?? null;
}

/** Penalty run-up start: behind the ball on the ball→goal axis. */
function penaltyStandPoint(world: RealGkWorld, r: RestartState): Vec2 {
  const goal = goalCenterForTeam(world.size, opposite(r.team));
  const dx = r.spot.x - goal.x;
  const dy = r.spot.y - goal.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: r.spot.x + (dx / len) * PENALTY_RUNUP, y: r.spot.y + (dy / len) * PENALTY_RUNUP };
}

/** Places the ball, computes everyone's set-piece spot, and (for fouls) gets the victim back up. */
function beginSetup(world: RealGkWorld, r: RestartState): void {
  if (r.foul) {
    const victim = world.players.find((p) => p.id === r.foul?.victimId);
    if (victim) {
      victim.mode = victim.idleMode;
      victim.actionElapsed = 0;
    }
    if (r.foul.card) {
      const offender = world.players.find((p) => p.id === r.foul?.offenderId);
      const note = Status.sentOff(offender?.name ?? 'The offender');
      setStatus(world, note.title, note.text);
    } else {
      const note = r.kind === RestartKind.Penalty ? Status.penalty(r.team) : Status.freeKick(r.team);
      setStatus(world, note.title, note.text);
    }
  }
  placeDeadBall(world, r);
  r.targets = computeRestartTargets(world, r);
  if (r.kind === RestartKind.Penalty && r.takerId !== null) r.targets[r.takerId] = penaltyStandPoint(world, r);
  r.stage = RestartStage.Setup;
  r.timer = 0;
}

/** Where (and how) the taker sends the ball back into play. */
function restartStrike(world: RealGkWorld, r: RestartState, taker: RealGkPlayer): { target: Vec2; power: number; lob: boolean } {
  const { size } = world;
  const def = opposite(r.team);

  if (r.kind === RestartKind.Corner) {
    // Cross into the crowd waiting in the box (headers can trigger on the lofted ball).
    const lat = def === Team.Blue ? 0.11 : 0.89;
    return { target: pointOnField(size, lat, 0.36 + Math.random() * 0.22), power: 335, lob: true };
  }
  if (r.kind === RestartKind.Penalty) {
    // Placed shot inside the mouth — the keeper's dive decides it.
    const g = GOALS[def];
    const depth = g.depthTop + 0.04 + Math.random() * (g.depthBottom - g.depthTop - 0.08);
    return { target: pointOnField(size, g.lat, depth), power: 435, lob: false };
  }
  if (r.kind === RestartKind.FreeKick) {
    const goal = goalCenterForTeam(size, def);
    const range = distTo(taker, goal);
    if (range < size.width * 0.32) {
      // In range: curl it at a corner of the mouth over the wall.
      const g = GOALS[def];
      const depth = Math.random() < 0.5 ? g.depthTop + 0.05 : g.depthBottom - 0.05;
      return { target: pointOnField(size, g.lat, depth), power: 420, lob: false };
    }
    // Too far: loft it into the box.
    const lat = def === Team.Blue ? 0.14 : 0.86;
    return { target: pointOnField(size, lat, 0.35 + Math.random() * 0.3), power: 345, lob: true };
  }
  if (r.kind === RestartKind.GoalKick) {
    const lat = r.team === Team.Blue ? 0.62 : 0.38;
    const depth = clamp(fieldRatios(size, taker.x, taker.y).depth, 0.3, 0.7);
    return { target: pointOnField(size, lat, depth), power: 350, lob: true };
  }
  // Throw-in: short ball to the nearest teammate, else infield toward center.
  const mate = world.players
    .filter((p) => p.team === r.team && p.id !== taker.id)
    .sort((a, b) => distTo(a, { x: taker.x, y: taker.y }) - distTo(b, { x: taker.x, y: taker.y }))[0];
  return { target: mate ? { x: mate.x, y: mate.y } : pointOnField(size, 0.5, 0.5), power: 250, lob: false };
}

/**
 * Walks everyone to their set-piece spot. The taker heads for his own target (no pitch clamp — corner and
 * throw-in takers stand right on the line); a sent-off offender walks straight off the bottom of the pitch.
 * `takerOverride` redirects the taker mid-stage (the penalty run-up).
 */
function positionForRestart(world: RealGkWorld, r: RestartState, dt: number, takerOverride?: Vec2): void {
  const offenderId = r.foul?.card ? r.foul.offenderId : null;
  for (const p of world.players) {
    if (p.id === offenderId) {
      moveToward(world, p, p.x, world.size.height * 0.98, 80, dt, false);
      continue;
    }
    if (r.takerId !== null && p.id === r.takerId) {
      const t = takerOverride ?? r.targets?.[p.id] ?? r.spot;
      moveToward(world, p, t.x, t.y, takerOverride ? 185 : 150, dt, false);
      continue;
    }
    const t = r.targets?.[p.id] ?? pointOnField(world.size, p.homeLat, p.homeDepth);
    moveToward(world, p, t.x, t.y, p.role === Role.GK ? 70 : 115, dt);
  }
}

/** Pins the dead ball to the restart spot while the set piece is being staged. */
function holdBallOnSpot(world: RealGkWorld, r: RestartState): void {
  world.ball.x = r.spot.x;
  world.ball.y = r.spot.y;
  world.ball.z = 0;
}

/** Strikes the ball back into play and (for a red card) despawns the sent-off offender. */
function takeRestart(world: RealGkWorld, r: RestartState): void {
  const taker = world.players.find((p) => p.id === r.takerId) ?? null;
  if (taker) {
    const { target, power, lob } = restartStrike(world, r, taker);
    const intent = r.kind === RestartKind.Penalty || (r.kind === RestartKind.FreeKick && !lob) ? KickIntent.Shot : KickIntent.Pass;
    kickBall(world, taker, target.x, target.y, power, lob, { intent });
  }
  if (r.foul?.card) {
    const offender = world.players.find((p) => p.id === r.foul?.offenderId);
    if (offender) {
      world.sentOffNames.push(offender.name);
      world.players = world.players.filter((p) => p.id !== offender.id);
    }
  }
  world.match.restart = null;
}

/**
 * Runs an in-progress dead-ball restart (v5). Out-of-play: BallOut (rolls off) → Setup (placed at the spot,
 * everyone stages) → Ready (broadcast hold) → Taking. Fouls prepend FoulFreeze (victim down, play frozen)
 * and RefArrive (referee sprints over, whistles or shows the red card) before the same Setup flow.
 */
export function updateRestart(world: RealGkWorld, dt: number): void {
  const r = world.match.restart;
  if (!r) return;
  r.timer += dt;

  // Keep the sideline actors alive during the stoppage.
  updateReferee(world, dt);
  updateCoach(world, dt);

  if (r.stage === RestartStage.FoulFreeze) {
    holdFoulScene(world, dt);
    if (r.timer >= FOUL_FREEZE_SECONDS && r.foul) {
      spawnRefereeFoul(world, r.foul.at.x, r.foul.at.y - 34, r.foul.card);
      r.stage = RestartStage.RefArrive;
      r.timer = 0;
    }
    return;
  }

  if (r.stage === RestartStage.RefArrive) {
    holdFoulScene(world, dt);
    const refDone =
      world.referee.phase === RefPhase.ReturnPatrol ||
      world.referee.phase === RefPhase.Patrol ||
      world.referee.phase === RefPhase.PatrolPause;
    if (refDone || r.timer >= REF_ARRIVE_MAX_SECONDS) beginSetup(world, r);
    return;
  }

  if (r.stage === RestartStage.BallOut) {
    integrateBallFlight(world, dt);
    if (r.timer >= BALL_OUT_SECONDS) beginSetup(world, r);
    return;
  }

  const taker = world.players.find((p) => p.id === r.takerId) ?? null;

  if (r.stage === RestartStage.Setup) {
    positionForRestart(world, r, dt);
    holdBallOnSpot(world, r);
    const standSpot = (r.takerId !== null && r.targets?.[r.takerId]) || r.spot;
    const reached = !!taker && distTo(taker, standSpot) <= TAKE_REACH;
    if ((reached && r.timer >= SETUP_MIN[r.kind]) || r.timer >= SETUP_MAX[r.kind]) {
      r.stage = RestartStage.Ready;
      r.timer = 0;
    }
    return;
  }

  if (r.stage === RestartStage.Ready) {
    holdBallOnSpot(world, r);
    if (r.kind === RestartKind.Penalty && taker) {
      // The run-up: sprint from the stand point to the ball, strike on contact.
      positionForRestart(world, r, dt, { x: world.ball.x, y: world.ball.y });
      if (distTo(taker, r.spot) <= PENALTY_STRIKE_REACH || r.timer >= READY_HOLD[r.kind]) {
        r.stage = RestartStage.Taking;
        r.timer = 0;
      }
      return;
    }
    positionForRestart(world, r, dt);
    if (r.timer >= READY_HOLD[r.kind]) {
      r.stage = RestartStage.Taking;
      r.timer = 0;
    }
    return;
  }

  takeRestart(world, r);
}
