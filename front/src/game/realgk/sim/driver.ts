import { Role, Team } from '../enums';
import { fieldRatios, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { ballOwner, kickBall, teamPlayers } from './ball';
import { Status } from './messages';
import { goal, setStatus } from './rules';
import { commitShot } from './shot';

/** How long the feed's intended receivers keep trap/claim priority after a possession grant. */
const GRANT_SECONDS = 2.5;

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

/**
 * Turns possession over to `team` without teleporting the ball. If an opponent holds it, they play a
 * real (mis)pass toward the granted team's nearest receiver — trap/claim completes the exchange; a
 * loose ball just gets claim priority via the grant window. Never snaps ownerId across the pitch.
 */
function grantPossession(world: RealGkWorld, team: Team): void {
  const taker = nearestOutfielder(world, team) ?? teamPlayers(world, team).find((p) => p.role !== Role.GK) ?? null;
  if (!taker) return;
  world.possessionGrant = { team, timer: GRANT_SECONDS };
  const owner = ballOwner(world);
  if (owner && owner.team !== team) {
    const { ball } = world;
    const dist = Math.hypot(taker.x - ball.x, taker.y - ball.y);
    // A slightly wayward pass toward the receiver — reads as a turnover, arrives as a rolling ball.
    kickBall(world, owner, taker.x + (Math.random() - 0.5) * 30, taker.y + (Math.random() - 0.5) * 20, clamp(dist * 1.4, 180, 340), false);
  }
  taker.think = 0;
}

/** The team currently on the ball + how threatening (0..1). Steers the whole shape via `intent`. */
export function setPossessionDriven(world: RealGkWorld, team: Team, threat: number): void {
  const t = clamp(threat, 0, 1);
  world.intent.attackingTeam = team;
  world.intent.threat = Math.max(world.intent.threat, t);
  const owner = ballOwner(world);
  if (!owner || owner.team !== team) grantPossession(world, team); // possession changed hands per the feed
}

/** Commit a shot on goal from the attacking team. */
export function injectShotDriven(world: RealGkWorld, team: Team): void {
  if (world.match.restart) return; // a staged restart owns the ball — the next event re-molds play
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
  world.match.restart = null; // the goal outranks any staged restart (step() gives restart priority)
  world.intent.attackingTeam = team;
  world.intent.threat = 0.4; // danger resets once the ball hits the net
  goal(world, team, false);
}

/**
 * Concede a corner for the attacking team — organically: the defending player nearest the ball clears
 * it over their OWN goal line (outside the mouth). The normal out-of-play detection awards the corner
 * and, with `deadBallSequence` on, stages the full flow (banner, taker walks over, real cross). The
 * ball always travels — never snaps to the flag.
 */
export function injectCornerDriven(world: RealGkWorld, team: Team): void {
  if (world.match.restart) return; // already staging a restart
  world.intent.attackingTeam = team;
  world.intent.threat = Math.max(world.intent.threat, 0.7);
  const defending = opposite(team);
  const kicker = nearestOutfielder(world, defending) ?? teamPlayers(world, defending).find((p) => p.role === Role.GK) ?? null;
  if (!kicker) return;
  // Clear past the defending byline (Blue defends lat 0), staying clear of the goal mouth.
  const top = fieldRatios(world.size, world.ball.x, world.ball.y).depth < 0.5;
  const target = pointOnField(world.size, defending === Team.Blue ? -0.05 : 1.05, top ? 0.1 : 0.9);
  const dist = Math.hypot(target.x - world.ball.x, target.y - world.ball.y);
  kickBall(world, kicker, target.x, target.y, clamp(dist * 1.2, 220, 420), false);
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
