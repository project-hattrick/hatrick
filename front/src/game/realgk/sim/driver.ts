import { Role, Team } from '../enums';
import { cornerSpot } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { ballOwner, teamPlayers } from './ball';
import { Status } from './messages';
import { goal, setStatus } from './rules';
import { commitShot } from './shot';

/**
 * Feed director for the realgk engine — mirrors the headsonly `HeadsOnlyHandle` director. Pure functions
 * over `world`, called by the handle wrappers in `engine.ts` while `world.driven` is on. The match feed
 * dictates goals/shots/score/corners/cards; these helpers translate each into on-pitch action while the
 * autonomous positioning AI keeps the shape alive (the autonomous OUTCOMES are gated off in driven mode).
 */

const opposite = (team: Team): Team => (team === Team.Blue ? Team.Red : Team.Blue);

/** The team's non-keeper closest to the ball. */
function nearestOutfielder(world: RealGkWorld, team: Team): RealGkPlayer | null {
  const { ball } = world;
  let pick: RealGkPlayer | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const p of teamPlayers(world, team)) {
    if (p.role === Role.GK) continue;
    const d = Math.hypot(p.x - ball.x, p.y - ball.y);
    if (d < best) {
      best = d;
      pick = p;
    }
  }
  return pick;
}

/** The team's non-keeper furthest toward the opponent goal (attacking direction = player.dir). */
function mostAdvanced(world: RealGkWorld, team: Team): RealGkPlayer | null {
  let pick: RealGkPlayer | null = null;
  let best = Number.NEGATIVE_INFINITY;
  for (const p of teamPlayers(world, team)) {
    if (p.role === Role.GK) continue;
    const forwardness = p.x * p.dir; // higher = closer to the opponent goal
    if (forwardness > best) {
      best = forwardness;
      pick = p;
    }
  }
  return pick;
}

/** Hands the ball to the team's nearest outfielder (possession changed hands per the feed). */
function giveBall(world: RealGkWorld, team: Team): void {
  const taker = nearestOutfielder(world, team) ?? teamPlayers(world, team).find((p) => p.role !== Role.GK) ?? null;
  if (!taker) return;
  const { ball } = world;
  ball.ownerId = taker.id;
  ball.lastKickerId = taker.id;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.z = 0;
  ball.cooldown = 0.15;
  ball.lofted = false;
  taker.think = 0.2 + Math.random() * 0.3;
}

/** The team currently on the ball + how threatening (0..1). Steers the whole shape via `intent`. */
export function setPossessionDriven(world: RealGkWorld, team: Team, threat: number): void {
  const t = clamp(threat, 0, 1);
  world.intent.attackingTeam = team;
  world.intent.threat = Math.max(world.intent.threat, t);
  const owner = ballOwner(world);
  if (!owner || owner.team !== team) giveBall(world, team); // possession changed hands per the feed
}

/** Commit a shot on goal from the attacking team. */
export function injectShotDriven(world: RealGkWorld, team: Team): void {
  world.intent.attackingTeam = team;
  world.intent.threat = Math.max(world.intent.threat, 0.8);
  const owner = ballOwner(world);
  const shooter = owner && owner.team === team ? owner : mostAdvanced(world, team) ?? nearestOutfielder(world, team);
  if (!shooter) return;
  world.ball.ownerId = shooter.id;
  commitShot(world, shooter);
}

/**
 * Celebrate a goal for the attacking team. The score is authoritative from the feed (setScore), so this
 * runs the full celebration/replay/kickoff flow WITHOUT counting — `goal(world, team, false)`.
 */
export function injectGoalDriven(world: RealGkWorld, team: Team): void {
  world.intent.attackingTeam = team;
  world.intent.threat = 0.4; // danger resets once the ball hits the net
  goal(world, team, false);
}

/**
 * Stage a corner for the attacking team — lightweight (the hero config keeps `deadBallSequence` off, and
 * the full restart machinery would freeze the ambient sim). Places the ball at the corner and gives it away.
 */
export function injectCornerDriven(world: RealGkWorld, team: Team): void {
  world.intent.attackingTeam = team;
  world.intent.threat = Math.max(world.intent.threat, 0.7);
  const top = Math.random() < 0.5;
  const spot = cornerSpot(world.size, opposite(team), top); // corner is taken at the DEFENDING team's goal line
  world.ball.x = spot.x;
  world.ball.y = spot.y;
  world.ball.z = 0;
  world.ball.vx = 0;
  world.ball.vy = 0;
  world.ball.vz = 0;
  giveBall(world, team);
  const note = Status.corner(team);
  setStatus(world, note.title, note.text);
}

/** Card toast for a team — lightweight (does not invoke the `fouls` machinery, which is off in the hero). */
export function injectCardDriven(world: RealGkWorld, team: Team): void {
  const note = Status.card(team);
  setStatus(world, note.title, note.text);
}

/** Authoritative scoreboard (Blue = home / participant 1, Red = away / participant 2). */
export function setScoreDriven(world: RealGkWorld, blue: number, red: number): void {
  world.match.blue = blue;
  world.match.red = red;
}
