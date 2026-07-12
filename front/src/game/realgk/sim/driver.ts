import { RestartKind, RestartStage, Role, ShotOutcome, Team } from '../enums';
import { GOALS, fieldRatios, penaltySpot, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld, Vec2 } from '../types';
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

/**
 * Commit a shot on goal from the attacking team. The feed `outcome` shapes how it resolves so shots stop
 * reading as a keeper forcefield: OffTarget flies wide (→ goal kick, not a save); Woodwork rattles a post
 * (side save); OnTarget/Blocked/unset stay on target for the keeper's dive + parry. A real goal still only
 * arrives via injectGoal.
 */
export function injectShotDriven(world: RealGkWorld, team: Team, outcome?: string): void {
  if (world.match.restart) return; // a staged restart owns the ball — the next event re-molds play
  world.intent.attackingTeam = team;
  world.intent.threat = Math.max(world.intent.threat, 0.8);
  const owner = ballOwner(world);
  const shooter = owner && owner.team === team ? owner : mostAdvanced(world, team) ?? nearestOutfielder(world, team);
  if (!shooter) return;

  const def = opposite(team);
  const g = GOALS[def];
  world.drivenShotWide = null;
  shooter.drivenShotAim = null;
  if (outcome === ShotOutcome.OffTarget) {
    // Wide/over: aim PAST the byline, clearly outside the mouth, so no parry catches it. When it crosses
    // the line `drivenShotWide` forces a goal kick (see updateBall) — a miss reads as a miss.
    const depth = Math.random() < 0.5 ? g.depthTop - 0.13 : g.depthBottom + 0.13;
    shooter.drivenShotAim = pointOnField(world.size, def === Team.Blue ? -0.03 : 1.03, clamp(depth, 0.02, 0.98));
    world.drivenShotWide = def;
  } else if (outcome === ShotOutcome.Woodwork) {
    // Off the frame: aim at a post edge so the keeper flings full-stretch to the side (rattle + save).
    const depth = Math.random() < 0.5 ? g.depthTop + 0.01 : g.depthBottom - 0.01;
    shooter.drivenShotAim = pointOnField(world.size, g.lat, clamp(depth, 0.02, 0.98));
  }

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
 * Concede a corner for the attacking team — organically: an ATTACKER's touch flies over the defending
 * byline (outside the mouth), which is exactly what the out-of-play detection awards a corner for (a
 * defender's clearance would be scored as a goal kick — see `bylineRestart`). With `deadBallSequence`
 * on this stages the full flow (banner, taker walks over, real cross). The ball always travels — never
 * snaps to the flag.
 */
export function injectCornerDriven(world: RealGkWorld, team: Team): void {
  if (world.match.restart) return; // already staging a restart
  world.intent.attackingTeam = team;
  world.intent.threat = Math.max(world.intent.threat, 0.7);
  const defending = opposite(team);
  // Kicker MUST be on the attacking team so `lastKicker === attacker` → corner (not goal kick).
  const kicker = mostAdvanced(world, team) ?? nearestOutfielder(world, team) ?? teamPlayers(world, team).find((p) => p.role !== Role.GK) ?? null;
  if (!kicker) return;
  // Send it past the DEFENDING byline (Blue defends lat 0), clear of the goal mouth (top/bottom corner).
  const top = fieldRatios(world.size, world.ball.x, world.ball.y).depth < 0.5;
  const target = pointOnField(world.size, defending === Team.Blue ? -0.05 : 1.05, top ? 0.1 : 0.9);
  const dist = Math.hypot(target.x - world.ball.x, target.y - world.ball.y);
  kickBall(world, kicker, target.x, target.y, clamp(dist * 1.2, 220, 420), false);
  const note = Status.corner(team);
  setStatus(world, note.title, note.text);
}

/**
 * Card for a team. Fouls machinery is off in driven mode, so this stays lightweight: it names the card
 * in the ticker AND bumps `cardFlashSeq` so the HUD can slam a yellow/red card graphic on screen. A RED
 * card also actually sends a player off — the carded team plays on a man down (persists across kickoffs
 * via `sentOffNames`), so the pitch shows the real 11-v-10.
 */
export function injectCardDriven(world: RealGkWorld, team: Team, red = false): void {
  world.match.cardFlashSeq += 1;
  world.match.cardFlashColor = red ? 'red' : 'yellow';
  world.match.cardFlashTeam = team;
  if (red) sendOff(world, team);
  const note = Status.card(team, red);
  setStatus(world, note.title, note.text);
}

/** Sends one outfielder of `team` off (down to ten). Keeps ≥7 on the side and never picks the ball
 *  carrier (that would drop a live ball mid-dribble). Names go to `sentOffNames` so resetPlayers keeps
 *  them off across kickoff resets. */
function sendOff(world: RealGkWorld, team: Team): void {
  if (teamPlayers(world, team).length <= 7) return; // never below a legal minimum
  const candidates = world.players.filter(
    (p) => p.team === team && p.role !== Role.GK && p.id !== world.ball.ownerId,
  );
  if (!candidates.length) return;
  // Prefer a deeper player (a defender walking off reads better than a striker vanishing from the box).
  // `homeLat * dir` is small near a team's OWN goal for both sides (Red's lat is mirrored), so min = deepest.
  const off = candidates.reduce((best, p) => (p.homeLat * p.dir < best.homeLat * best.dir ? p : best));
  world.sentOffNames.push(off.name);
  world.players = world.players.filter((p) => p.id !== off.id);
}

/** Places a dead ball at `spot` and stages a restart of `kind` for `team`. The restart machinery
 *  (restart.ts) then walks everyone into position and puts it back in play — reused for feed penalties
 *  and free kicks (which the engine used to ignore entirely). Starts at BallOut so beginSetup runs. */
function stageDrivenRestart(world: RealGkWorld, kind: RestartKind, team: Team, spot: Vec2): void {
  const { ball } = world;
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
  ball.cooldown = 0.5;
  world.match.restart = { kind, team, stage: RestartStage.BallOut, timer: 0, spot, takerId: null };
}

/**
 * Feed-awarded PENALTY: stage the spot kick (full box staging + run-up + strike via restart.ts). The
 * feed stays authoritative on the outcome — if it's scored, a `goal` event arrives and injectGoalDriven
 * preempts the restart; if it's missed/saved, the driven shot is parried like any other.
 */
export function injectPenaltyDriven(world: RealGkWorld, team: Team): void {
  if (world.match.restart) return;
  world.intent.attackingTeam = team;
  world.intent.threat = 1;
  stageDrivenRestart(world, RestartKind.Penalty, team, penaltySpot(world.size, opposite(team)));
  const note = Status.penalty(team);
  setStatus(world, note.title, note.text);
}

/**
 * Feed-awarded FREE KICK (dangerous ones only — see the mapper): stage it with a defensive wall. The feed
 * gives no exact spot, so place it in the attacking third, closer to goal the more dangerous it is.
 */
export function injectFreeKickDriven(world: RealGkWorld, team: Team, danger = 0.6): void {
  if (world.match.restart) return;
  const d = clamp(danger, 0.2, 0.95);
  world.intent.attackingTeam = team;
  world.intent.threat = Math.max(world.intent.threat, d);
  const attackLat = team === Team.Blue ? clamp(0.6 + d * 0.22, 0.2, 0.82) : clamp(0.4 - d * 0.22, 0.18, 0.8);
  const depth = 0.32 + Math.random() * 0.36;
  stageDrivenRestart(world, RestartKind.FreeKick, team, pointOnField(world.size, attackLat, depth));
  const note = Status.freeKick(team);
  setStatus(world, note.title, note.text);
}

/** Authoritative scoreboard (Blue = home / participant 1, Red = away / participant 2). */
export function setScoreDriven(world: RealGkWorld, blue: number, red: number): void {
  world.match.blue = blue;
  world.match.red = red;
}
