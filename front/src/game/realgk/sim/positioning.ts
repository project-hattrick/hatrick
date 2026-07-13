import { Role, RunKind, Team } from '../enums';
import { fieldRatios, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld, Vec2 } from '../types';
import { clamp, lerp } from '../util';
import { ballOwner, kickBall, teamPlayers } from './ball';
import { fillerShotAllowed } from './filler';
import { Status } from './messages';
import { setStatus } from './rules';
import { commitShot } from './shot';

/**
 * smartAI positioning (opt-in via `features.smartAI`). Real-football behavior on top of the legacy sim:
 * the team shape slides as a unit (ball-oriented shifting + role responsibility), off-ball players make
 * time-persistent runs, the back line loosely man-marks + a 2nd player presses, and the ball owner picks
 * passes by openness. Everything here is cosmetic w.r.t. the feed — it never scores in driven mode.
 *
 * Axes (engine convention): `lat` = ALONG the pitch (0 = Blue's goal, 1 = Red's goal; Blue attacks +),
 * `depth` = ACROSS the pitch (touchline↔touchline). Blue `dir = +1`, Red `-1`; Red homes are mirrored at
 * spawn, so one formula serves both sides via `player.dir`.
 */

export interface ShapeContext {
  possessionTeam: Team | null;
  ballRatio: { lat: number; depth: number };
  /** Ids of the 1-2 defending players sent to press the ball (besides the plain chaser). */
  presserIds: Set<number>;
}

/** Along-pitch (push/drop) gain per role, by phase. Higher = follows the ball further up/down the pitch. */
const ALONG_ATTACK: Record<Role, number> = { GK: 0, DEF: 0.28, MID: 0.46, ST: 0.55 };
const ALONG_DEFEND: Record<Role, number> = { GK: 0, DEF: 0.55, MID: 0.44, ST: 0.24 };
const ALONG_NEUTRAL = 0.16;
/** Across-pitch (ball-side slide) gain — the whole block shifts toward the ball's side, keeping shape. */
const ACROSS_GAIN = 0.32;
/** Engine-only upward bias: push the whole shape toward the far touchline (the ad boards / top of the
 *  view) so the play happens UP near the placares instead of hugging the near touchline. depth 0 = far
 *  side. Paired with a tight upper depth clamp so the block lives in the top of the pitch. */
const UP_BIAS = 0.24;

/** Per-role along-pitch clamp in ATTACK-PROGRESS space (0 = own goal, 1 = opponent goal). */
const ALONG_BACK: Record<Role, number> = { GK: 0.02, DEF: 0.1, MID: 0.2, ST: 0.34 };
const ALONG_FWD: Record<Role, number> = { GK: 0.1, DEF: 0.55, MID: 0.8, ST: 0.94 };

function minDistTo(p: RealGkPlayer, arr: RealGkPlayer[]): number {
  let best = Infinity;
  for (const o of arr) {
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if (d < best) best = d;
  }
  return best;
}

/** Builds the per-tick shared context once (ball ratio, possession, the defending team's 2 pressers). */
export function buildShapeContext(world: RealGkWorld): ShapeContext {
  const { ball, size } = world;
  const owner = ballOwner(world);
  let possessionTeam: Team | null = owner ? owner.team : null;
  if (possessionTeam === null && world.driven) possessionTeam = world.intent.attackingTeam;

  const presserIds = new Set<number>();
  if (possessionTeam !== null) {
    const defenders = teamPlayers(world, possessionTeam === Team.Blue ? Team.Red : Team.Blue).filter((p) => p.role !== Role.GK);
    // Two nearest defenders to the ball step to press (the plain chaser is the 1st; this adds support).
    defenders
      .sort((a, b) => Math.hypot(a.x - ball.x, a.y - ball.y) - Math.hypot(b.x - ball.x, b.y - ball.y))
      .slice(0, 2)
      .forEach((p) => presserIds.add(p.id));
  }

  return { possessionTeam, ballRatio: fieldRatios(size, ball.x, ball.y), presserIds };
}

/** The GK support point — kept identical to the legacy `supportTarget` keeper branch. */
function gkTarget(world: RealGkWorld, player: RealGkPlayer, ballRatio: { lat: number; depth: number }): Vec2 {
  const { size } = world;
  const lively = world.cfg.features?.livelyMatch === true;
  let lat: number;
  let depth: number;
  if (lively) {
    const blue = player.team === Team.Blue;
    const goalLat = blue ? 0.035 : 0.965;
    const upfield = blue ? clamp(ballRatio.lat, 0, 1) : clamp(1 - ballRatio.lat, 0, 1);
    lat = blue ? goalLat + upfield * 0.1 : goalLat - upfield * 0.1;
    depth = clamp(0.5 + (ballRatio.depth - 0.5) * 0.72, 0.28, 0.72);
  } else {
    lat = player.team === Team.Blue ? 0.05 : 0.95;
    depth = clamp(ballRatio.depth, 0.34, 0.66);
  }
  return pointOnField(size, lat, depth);
}

/** Clamp an along-pitch lat to the role's sane band (works both directions via attack-progress). When the
 *  team is NOT attacking (kickoff / loose ball / defending), the forward limit caps at the halfway line so
 *  each side stays in its OWN half — no mixed shape at the start. Attacking lets the block push up. */
function clampAlong(role: Role, lat: number, dir: number, attacking: boolean): number {
  const a = dir > 0 ? lat : 1 - lat;
  const fwd = attacking ? ALONG_FWD[role] : 0.5;
  const c = clamp(a, ALONG_BACK[role], fwd);
  return dir > 0 ? c : 1 - c;
}

/**
 * The dynamic team-shape target for an off-ball outfield player (or GK via `gkTarget`). Slides the block
 * along the pitch (role responsibility) + across toward the ball, biases toward an active off-ball run,
 * and — for a marking defender or a 2nd presser — toward the mark / the ball.
 */
export function smartSupportTarget(world: RealGkWorld, player: RealGkPlayer, ctx: ShapeContext): Vec2 {
  const { size } = world;
  const { ballRatio } = ctx;
  if (player.role === Role.GK) return gkTarget(world, player, ballRatio);

  const attacking = ctx.possessionTeam === player.team;
  const defending = ctx.possessionTeam !== null && ctx.possessionTeam !== player.team;
  const alongGain = attacking ? ALONG_ATTACK[player.role] : defending ? ALONG_DEFEND[player.role] : ALONG_NEUTRAL;

  // Base block: slide along toward the ball's lat (push/drop) + across toward the ball's side, keep width.
  let lat = player.homeLat + alongGain * (ballRatio.lat - player.homeLat);
  let depth = clamp(player.homeDepth - UP_BIAS + ACROSS_GAIN * (ballRatio.depth - 0.5) + player.laneOffset * 4, 0.03, 0.62);
  // Small stable per-player breathing so the line isn't robotic (much smaller than legacy jitter).
  lat += (idNoise(player.id, 1) - 0.5) * 0.02;

  // Marking defender: sit goal-side of the assigned attacker.
  if (player.role === Role.DEF && defending && player.markId !== -1) {
    const mark = world.players.find((p) => p.id === player.markId);
    if (mark) {
      const mr = fieldRatios(size, mark.x, mark.y);
      const ownGoalLat = player.dir > 0 ? 0 : 1;
      lat = lerp(lat, lerp(mr.lat, ownGoalLat, 0.2), 0.6);
      depth = lerp(depth, mr.depth, 0.6);
    }
  }

  // 2nd presser: commit toward the ball (the plain chaser is handled in players.ts).
  if (player.isPresser) {
    lat = lerp(lat, ballRatio.lat, 0.7);
    depth = lerp(depth, ballRatio.depth, 0.7);
  }

  // Active off-ball run overrides toward the run target (eased in the last/first 0.4s of the run).
  if (player.runKind !== RunKind.None) {
    const ease = clamp(Math.min(player.runTimer, 0.4) / 0.4, 0, 1);
    lat = lerp(lat, player.runTargetLat, 0.65 * ease);
    depth = lerp(depth, player.runTargetDepth, 0.65 * ease);
  }

  lat = clampAlong(player.role, lat, player.dir, attacking);
  return pointOnField(size, clamp(lat, 0.06, 0.94), clamp(depth, 0.03, 0.62));
}

/** Stable per-player pseudo-random in [0,1) (no per-frame RNG) — matches players.ts idNoise. */
function idNoise(id: number, salt: number): number {
  const x = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The LEGACY off-ball support target (flag-off path) — moved here from players.ts verbatim so both the
 * legacy and smart paths live together and players.ts stays under the line cap. Byte-identical behavior.
 */
export function supportTarget(world: RealGkWorld, player: RealGkPlayer, possessionTeam: Team | null): Vec2 {
  const { ball, size } = world;
  const ballRatio = fieldRatios(size, ball.x, ball.y);
  const attacking = possessionTeam === player.team;
  const press = possessionTeam && possessionTeam !== player.team;
  const lively = world.cfg.features?.livelyMatch === true;
  // Stable per-player variety so the shape breathes instead of moving in lockstep.
  const jLat = lively ? (idNoise(player.id, 1) - 0.5) * 0.09 : 0;
  const jDepth = lively ? (idNoise(player.id, 2) - 0.5) * 0.11 : 0;
  const drift = lively ? 0.72 + idNoise(player.id, 3) * 0.66 : 1; // per-player lead/lag on the ball

  let lat = player.homeLat;
  let depth = player.homeDepth;

  if (player.role === Role.GK) {
    if (lively) {
      // Sweeper-keeper: advance off the line when the ball is upfield, drop onto it as it nears; track depth.
      const blue = player.team === Team.Blue;
      const goalLat = blue ? 0.035 : 0.965;
      const upfield = blue ? clamp(ballRatio.lat, 0, 1) : clamp(1 - ballRatio.lat, 0, 1);
      lat = blue ? goalLat + upfield * 0.1 : goalLat - upfield * 0.1;
      depth = clamp(0.5 + (ballRatio.depth - 0.5) * 0.72, 0.28, 0.72);
    } else {
      lat = player.team === Team.Blue ? 0.05 : 0.95;
      depth = clamp(ballRatio.depth, 0.34, 0.66);
    }
  } else if (attacking) {
    lat = clamp(player.homeLat + player.dir * 0.06 + (ballRatio.lat - 0.5) * 0.18 * drift + jLat, 0.06, 0.94);
    depth = clamp(player.homeDepth + (ballRatio.depth - player.homeDepth) * 0.42 * drift + jDepth, 0.14, 0.86);
  } else if (press) {
    lat = clamp(player.homeLat + (ballRatio.lat - player.homeLat) * 0.16 * drift + jLat, 0.05, 0.95);
    depth = clamp(player.homeDepth + (ballRatio.depth - player.homeDepth) * 0.25 * drift + jDepth, 0.12, 0.88);
  } else {
    lat = clamp(player.homeLat + jLat, 0.05, 0.95);
    depth = clamp(player.homeDepth + jDepth, 0.12, 0.88);
  }
  return pointOnField(size, lat, depth);
}

/** Advances / expires a player's off-ball run; occasionally starts a new one when the team attacks. */
export function updateOffBallRun(world: RealGkWorld, player: RealGkPlayer, ctx: ShapeContext, dt: number): void {
  if (player.runCooldown > 0) player.runCooldown = Math.max(0, player.runCooldown - dt);
  if (player.runKind !== RunKind.None) {
    player.runTimer -= dt;
    if (player.runTimer <= 0) {
      player.runKind = RunKind.None;
      player.runCooldown = 2 + Math.random() * 2;
    }
    return;
  }
  const attacking = ctx.possessionTeam === player.team;
  if (!attacking || player.runCooldown > 0) return;
  if (player.role !== Role.ST && player.role !== Role.MID) return;
  // Only run once the ball is advanced into the attacking half, and only sometimes (~0.5 starts/sec).
  const attackProgress = player.dir > 0 ? ctx.ballRatio.lat : 1 - ctx.ballRatio.lat;
  if (attackProgress < 0.45) return;
  if (Math.random() > dt * 0.5) return;

  // Bias the run's depth AWAY from the nearest opponent (into space), toward the near channel.
  const opps = teamPlayers(world, player.team === Team.Blue ? Team.Red : Team.Blue);
  let nearOppDepth = 0.5;
  let bestD = Infinity;
  for (const o of opps) {
    const d = Math.hypot(o.x - player.x, o.y - player.y);
    if (d < bestD) {
      bestD = d;
      nearOppDepth = fieldRatios(world.size, o.x, o.y).depth;
    }
  }
  const away = nearOppDepth < 0.5 ? 0.72 : 0.28;

  const kindRoll = Math.random();
  const kind = player.role === Role.ST ? (kindRoll < 0.55 ? RunKind.Forward : RunKind.Diagonal) : kindRoll < 0.35 ? RunKind.Overlap : RunKind.Diagonal;
  const runProgress = clamp(attackProgress + 0.14 + Math.random() * 0.14, 0.2, 0.93);
  const runDepth =
    kind === RunKind.Forward ? clamp(player.homeDepth + (Math.random() - 0.5) * 0.12, 0.14, 0.86) : lerp(player.homeDepth, away, kind === RunKind.Overlap ? 0.8 : 0.45);

  player.runKind = kind;
  player.runTargetLat = player.dir > 0 ? runProgress : 1 - runProgress;
  player.runTargetDepth = clamp(runDepth, 0.1, 0.9);
  player.runTimer = 1.5 + Math.random() * 1.5;
}

/** Loose man-marking for the back line, with hysteresis so assignments don't thrash. */
export function updateMarking(world: RealGkWorld, player: RealGkPlayer, ctx: ShapeContext, dt: number): void {
  if (player.markCooldown > 0) player.markCooldown = Math.max(0, player.markCooldown - dt);
  const defending = ctx.possessionTeam !== null && ctx.possessionTeam !== player.team;
  if (player.role !== Role.DEF || !defending) {
    player.markId = -1;
    return;
  }
  let best: RealGkPlayer | null = null;
  let bestD = Infinity;
  for (const o of world.players) {
    if (o.team === player.team || o.role === Role.GK) continue;
    const d = Math.hypot(o.x - player.x, o.y - player.y);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  if (!best) {
    player.markId = -1;
    return;
  }
  if (player.markId === -1) {
    player.markId = best.id;
    player.markCooldown = 0.8;
    return;
  }
  if (player.markCooldown <= 0 && best.id !== player.markId) {
    const cur = world.players.find((p) => p.id === player.markId);
    const curD = cur ? Math.hypot(cur.x - player.x, cur.y - player.y) : Infinity;
    if (bestD < curD - 22) {
      // hysteresis margin
      player.markId = best.id;
      player.markCooldown = 0.8;
    }
  }
}

/** Min perpendicular distance of any opponent that lies BETWEEN owner and mate — a rough lane clearance. */
function laneClearance(owner: RealGkPlayer, mate: RealGkPlayer, opps: RealGkPlayer[]): number {
  const dx = mate.x - owner.x;
  const dy = mate.y - owner.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  let minPerp = 220;
  for (const o of opps) {
    const ox = o.x - owner.x;
    const oy = o.y - owner.y;
    const t = ox * nx + oy * ny;
    if (t < 0 || t > len) continue;
    const perp = Math.abs(ox * ny - oy * nx);
    if (perp < minPerp) minPerp = perp;
  }
  return minPerp;
}

/**
 * Openness-based on-ball decision. Shoots only in range + a sane cone; otherwise scores each teammate by
 * forward progress + space + lane clearance and plays the best (a through-ball when the mate is beyond the
 * last defender), or keeps carrying into space when unpressured. Respects the feed guard for shots.
 */
export function decideOwnerActionSmart(world: RealGkWorld, owner: RealGkPlayer): void {
  const { size } = world;
  const scale = world.cfg.fieldScale / 1.5;
  const goalPoint = pointOnField(size, owner.dir > 0 ? 0.98 : 0.02, 0.5);
  const distToGoal = Math.hypot(goalPoint.x - owner.x, goalPoint.y - owner.y);
  const mates = teamPlayers(world, owner.team).filter((p) => p.id !== owner.id && p.role !== Role.GK);
  const opps = teamPlayers(world, owner.team === Team.Blue ? Team.Red : Team.Blue).filter((p) => p.role !== Role.GK);

  // Keeper outlet — kept behaviorally like legacy.
  if (owner.role === Role.GK) {
    const outlet = mates.sort((a, b) => Math.hypot(a.x - owner.x, a.y - owner.y) - Math.hypot(b.x - owner.x, b.y - owner.y))[0];
    if (outlet) {
      kickBall(world, owner, outlet.x + owner.dir * 12, outlet.y, 286, Math.random() < 0.24);
      const note = Status.gkOutlet(owner.name);
      setStatus(world, note.title, note.text);
    }
    return;
  }

  const nearestOpp = minDistTo(owner, opps);
  const pressured = nearestOpp < 62 * scale;

  // Shoot: in range + goal roughly ahead (attack cone) + the exact legacy feed guard.
  const goalAhead = owner.dir * (goalPoint.x - owner.x);
  const cone = goalAhead > Math.abs(goalPoint.y - owner.y) * 0.6;
  if (distToGoal < 180 * scale && cone && (!world.driven || fillerShotAllowed(world))) {
    commitShot(world, owner);
    return;
  }

  // Deepest opposing defender in attack-progress space (to detect a through-ball past the last man).
  let lastManProgress = 0;
  for (const o of opps) {
    const prog = owner.dir > 0 ? o.x : -o.x;
    if (prog > lastManProgress) lastManProgress = prog;
  }

  let best: RealGkPlayer | null = null;
  let bestScore = -Infinity;
  for (const m of mates) {
    const forward = owner.dir * (m.x - owner.x);
    if (forward < -30 * scale) continue; // avoid square/back passes unless nothing else
    const space = minDistTo(m, opps);
    const lane = laneClearance(owner, m, opps);
    const score = forward * 0.6 + space * 1.0 + lane * 0.8;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }

  // No good option and not under pressure → keep dribbling into space (owner already carries in players.ts).
  if (!best || (!pressured && Math.random() < 0.5)) return;

  const mateProgress = owner.dir > 0 ? best.x : -best.x;
  const through = mateProgress > lastManProgress - 6 * scale;
  const lead = owner.dir * (through ? 34 : 18);
  kickBall(world, owner, best.x + lead, best.y, through ? 330 : 300, Math.random() < 0.18);
  const note = Status.through(owner.name, best.name);
  setStatus(world, note.title, note.text);
}
