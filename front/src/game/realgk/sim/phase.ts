import { CelebrationPhase, MatchPhase, PlayerAction, Team } from '../enums';
import { centerSpot, pointOnField } from '../field';
import type { RealGkWorld } from '../types';
import { clearCelebrations, startCelebrations, updatePlayerCelebration } from './celebration';
import { updateCoach } from './coach';
import { Status } from './messages';
import { moveToward } from './players';
import { spawnRefereeFoul, updateReferee } from './referee';
import { setStatus } from './rules';

/**
 * Match-structure beats (`features.matchStructure`): the half-time break and the full-time whistle.
 * Entered via `setPhaseDriven` (sim/world.ts) when a feed/director pushes `handle.setPhase`; `step()`
 * hands the tick here while `match.phase` is HalfTime/FullTime. New module so the co-edited world.ts
 * only gains the dispatch branches.
 */

/** Walking pace for the half-time walk-off (field px/s — a stroll, not a sprint). */
const BREAK_WALK_SPEED = 66;
/** Where the squads gather for the break: near the bottom apron, each team on its bench side. */
const BREAK_DEPTH = 0.86;
const BREAK_LAT_EDGE = 0.16;
const BREAK_LAT_STEP = 0.032;
/** Post-whistle beat before the sim hard-freezes under the result overlay. */
const FULL_TIME_FREEZE_SECONDS = 7;

/** Parks the ball dead where it lies (or at `spot`) so nothing claims it during a break. */
function parkBall(world: RealGkWorld, atCenter: boolean): void {
  const { ball } = world;
  if (atCenter) {
    const c = centerSpot(world.size);
    ball.x = c.x;
    ball.y = c.y;
  }
  ball.z = 0;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.spin = 0;
  ball.spinRate = 0;
  ball.ownerId = null;
  ball.lastKickerId = null;
  ball.cooldown = 5;
  ball.lofted = false;
}

/** The referee whistles the interval; players start walking off (movement runs in `updateHalfTime`). */
export function enterHalfTime(world: RealGkWorld): void {
  const { match } = world;
  match.phase = MatchPhase.HalfTime;
  match.phaseTimer = 0;
  match.celebration = 0;
  match.restart = null;
  clearCelebrations(world);
  parkBall(world, true);
  for (const p of world.players) p.action = PlayerAction.None;
  const c = centerSpot(world.size);
  spawnRefereeFoul(world, c.x, c.y, false); // sprint to center + whistle, no card
  const note = Status.halfTime();
  setStatus(world, note.title, note.text);
}

/** Break tick: each squad strolls to its touchline cluster and idles there until the resume kickoff. */
export function updateHalfTime(world: RealGkWorld, dt: number): void {
  const { match, players, size } = world;
  match.phaseTimer += dt;
  let blueIdx = 0;
  let redIdx = 0;
  for (const p of players) {
    const idx = p.team === Team.Blue ? blueIdx++ : redIdx++;
    const lat = p.team === Team.Blue ? BREAK_LAT_EDGE + idx * BREAK_LAT_STEP : 1 - BREAK_LAT_EDGE - idx * BREAK_LAT_STEP;
    const spot = pointOnField(size, lat, BREAK_DEPTH);
    moveToward(world, p, spot.x, spot.y, BREAK_WALK_SPEED, dt, false);
  }
  updateReferee(world, dt);
  updateCoach(world, dt);
}

/** Final whistle: everything stops, the winner celebrates, then the sim freezes under the overlay. */
export function enterFullTime(world: RealGkWorld): void {
  const { match } = world;
  match.phase = MatchPhase.FullTime;
  match.phaseTimer = 0;
  match.celebration = 0;
  match.restart = null;
  clearCelebrations(world);
  parkBall(world, false);
  for (const p of world.players) {
    p.action = PlayerAction.None;
    p.vx = 0;
    p.vy = 0;
    p.mode = p.idleMode;
    p.modeLock = 0;
  }
  const c = centerSpot(world.size);
  spawnRefereeFoul(world, c.x, c.y, false); // sprint to center + final whistle
  const winner = match.blue > match.red ? Team.Blue : match.red > match.blue ? Team.Red : null;
  if (winner) startCelebrations(world, winner);
  const note = Status.fullTime(winner);
  setStatus(world, note.title, note.text);
}

/** Full-time tick: referee finishes the whistle beat, winners run their routine, then a hard freeze. */
export function updateFullTime(world: RealGkWorld, dt: number): void {
  const { match } = world;
  match.phaseTimer += dt;
  if (match.phaseTimer > FULL_TIME_FREEZE_SECONDS) return; // the result overlay owns the screen now
  updateReferee(world, dt);
  updateCoach(world, dt);
  for (const p of world.players) {
    if (p.celebrationPhase !== CelebrationPhase.None) updatePlayerCelebration(world, p, dt);
  }
}
