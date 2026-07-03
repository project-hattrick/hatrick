import { RestartKind, RestartStage, Role, Team } from '../enums';
import { centerSpot, fieldRatios, goalCenterForTeam, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld, RestartState, Vec2 } from '../types';
import { clamp } from '../util';
import { integrateBallFlight, kickBall } from './ball';
import { updateCoach } from './coach';
import { moveToward, nearestPlayerToBall } from './players';
import { updateReferee } from './referee';

/** How long the ball rolls off the pitch before it's placed at the restart spot. */
const BALL_OUT_SECONDS = 0.7;
/** Cap on the taker's walk-over so a stuck taker never blocks the restart. */
const SETUP_MAX_SECONDS = 2.6;
/** Distance (px) at which the taker is close enough to strike the dead ball. */
const TAKE_REACH = 20;

const opposite = (t: Team): Team => (t === Team.Blue ? Team.Red : Team.Blue);

/** Strike parameters per restart type. */
const KICK: Record<RestartKind, { power: number; lob: boolean }> = {
  [RestartKind.None]: { power: 250, lob: false },
  [RestartKind.ThrowIn]: { power: 250, lob: false },
  [RestartKind.Corner]: { power: 330, lob: true },
  [RestartKind.GoalKick]: { power: 350, lob: true },
};

/** Snaps the dead ball onto the restart spot and picks the nearest player of the restart team as taker. */
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
  const taker = nearestPlayerToBall(world, r.team);
  r.takerId = taker?.id ?? null;
}

/** Where the taker sends the ball to put it back in play. */
function restartKickTarget(world: RealGkWorld, r: RestartState, taker: RealGkPlayer): Vec2 {
  const { size } = world;
  if (r.kind === RestartKind.Corner) {
    // Cross into the defending team's goal area.
    return goalCenterForTeam(size, opposite(r.team));
  }
  if (r.kind === RestartKind.GoalKick) {
    // Long clear upfield (Blue defends the left, clears toward higher lat; Red the reverse).
    const lat = r.team === Team.Blue ? 0.62 : 0.38;
    const depth = clamp(fieldRatios(size, taker.x, taker.y).depth, 0.3, 0.7);
    return pointOnField(size, lat, depth);
  }
  // Throw-in: short ball to the nearest teammate, else infield toward center.
  const mate = world.players
    .filter((p) => p.team === r.team && p.id !== taker.id)
    .sort((a, b) => Math.hypot(a.x - taker.x, a.y - taker.y) - Math.hypot(b.x - taker.x, b.y - taker.y))[0];
  return mate ? { x: mate.x, y: mate.y } : centerSpot(size);
}

/** Walks the taker onto the spot; everyone else eases back toward their formation home. */
function positionForRestart(world: RealGkWorld, r: RestartState, taker: RealGkPlayer | null, dt: number): void {
  for (const p of world.players) {
    if (taker && p.id === taker.id) {
      // No pitch clamp: corner/throw takers stand right on the flag/touchline at the very edge.
      moveToward(world, p, r.spot.x, r.spot.y, 150, dt, false);
      continue;
    }
    const home = pointOnField(world.size, p.homeLat, p.homeDepth);
    moveToward(world, p, home.x, home.y, p.role === Role.GK ? 60 : 90, dt);
  }
}

/**
 * Runs an in-progress dead-ball restart (v5). BallOut: the ball rolls off the pitch. Setup: it's placed at the
 * correct spot and the taker walks over. Taking: the taker strikes it back into play and the match resumes.
 */
export function updateRestart(world: RealGkWorld, dt: number): void {
  const r = world.match.restart;
  if (!r) return;
  r.timer += dt;

  // Keep the sideline actors alive during the stoppage.
  updateReferee(world, dt);
  updateCoach(world, dt);

  if (r.stage === RestartStage.BallOut) {
    integrateBallFlight(world, dt);
    if (r.timer >= BALL_OUT_SECONDS) {
      placeDeadBall(world, r);
      r.stage = RestartStage.Setup;
      r.timer = 0;
    }
    return;
  }

  if (r.stage === RestartStage.Setup) {
    const taker = world.players.find((p) => p.id === r.takerId) ?? null;
    positionForRestart(world, r, taker, dt);
    // Hold the ball on the spot until it's taken.
    world.ball.x = r.spot.x;
    world.ball.y = r.spot.y;
    world.ball.z = 0;
    const reached = !!taker && Math.hypot(taker.x - r.spot.x, taker.y - r.spot.y) <= TAKE_REACH;
    if (reached || r.timer >= SETUP_MAX_SECONDS) {
      r.stage = RestartStage.Taking;
      r.timer = 0;
    }
    return;
  }

  // Taking: strike the ball back into play, then hand control back to live play.
  const taker = world.players.find((p) => p.id === r.takerId) ?? null;
  if (taker) {
    const target = restartKickTarget(world, r, taker);
    const { power, lob } = KICK[r.kind];
    kickBall(world, taker, target.x, target.y, power, lob);
  }
  world.match.restart = null;
}
