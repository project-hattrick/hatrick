import { RestartKind, Role, Team } from '../enums';
import { GOALS, PENALTY, fieldRatios, goalCenterForTeam, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld, RestartState, Vec2 } from '../types';
import { clamp } from '../util';

const opposite = (t: Team): Team => (t === Team.Blue ? Team.Red : Team.Blue);

/** Lateral ratio at `dist` from `defendTeam`'s own goal line (Blue defends lat 0, Red lat 1). */
const latFrom = (defendTeam: Team, dist: number): number => (defendTeam === Team.Blue ? dist : 1 - dist);

/** Attacker crowd spots inside the box for a corner: [distance from goal line, depth]. */
const CORNER_ATTACK_SPOTS: Array<[number, number]> = [
  [0.1, 0.34],
  [0.15, 0.47],
  [0.09, 0.56],
  [0.19, 0.4],
];

/** How many defenders form the free-kick wall + their spacing along it (px). */
const WALL_SIZE = 3;
const WALL_SPACING = 17;
/** Wall distance from the ball, capped so short free kicks still leave room. */
const WALL_MAX_DIST = 95;

const dist = (a: { x: number; y: number }, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

function outfield(world: RealGkWorld, team: Team, excluded: Set<number>): RealGkPlayer[] {
  return world.players.filter((p) => p.team === team && p.role !== Role.GK && !excluded.has(p.id));
}

function keeperOf(world: RealGkWorld, team: Team): RealGkPlayer | undefined {
  return world.players.find((p) => p.team === team && p.role === Role.GK);
}

/** Defending keeper stands on his line at the middle of the goal mouth. */
function keeperLineSpot(world: RealGkWorld, defendTeam: Team): Vec2 {
  const g = GOALS[defendTeam];
  return pointOnField(world.size, latFrom(defendTeam, 0.045), (g.depthTop + g.depthBottom) * 0.5);
}

/** Corner: attackers crowd the box, defenders mark them goal-side, keeper on his line, rest lean in. */
function cornerTargets(world: RealGkWorld, r: RestartState, excluded: Set<number>): Record<number, Vec2> {
  const { size } = world;
  const def = opposite(r.team);
  const targets: Record<number, Vec2> = {};
  const kp = keeperOf(world, def);
  if (kp) targets[kp.id] = keeperLineSpot(world, def);

  const goal = goalCenterForTeam(size, def);
  const attackers = outfield(world, r.team, excluded).sort((a, b) => dist(a, goal) - dist(b, goal));
  const markers = outfield(world, def, excluded).sort((a, b) => dist(a, goal) - dist(b, goal));
  CORNER_ATTACK_SPOTS.forEach(([d, depth], i) => {
    const atk = attackers[i];
    if (!atk) return;
    targets[atk.id] = pointOnField(size, latFrom(def, d), depth);
    const mk = markers[i];
    if (mk) targets[mk.id] = pointOnField(size, latFrom(def, Math.max(0.05, d - 0.035)), clamp(depth + 0.045, 0.1, 0.9));
  });

  // Remaining outfielders lean a quarter of the way toward the box — the whole team shifts like a real
  // corner. Keepers are left out: the attacking one falls back to his formation home.
  const box = pointOnField(size, latFrom(def, 0.22), 0.45);
  for (const p of world.players) {
    if (p.id in targets || excluded.has(p.id) || p.role === Role.GK) continue;
    const home = pointOnField(size, p.homeLat, p.homeDepth);
    targets[p.id] = { x: home.x + (box.x - home.x) * 0.25, y: home.y + (box.y - home.y) * 0.25 };
  }
  return targets;
}

/** Penalty: keeper on his line, everyone else lined up along the edge of the box. */
function penaltyTargets(world: RealGkWorld, r: RestartState, excluded: Set<number>): Record<number, Vec2> {
  const { size } = world;
  const def = opposite(r.team);
  const targets: Record<number, Vec2> = {};
  const kp = keeperOf(world, def);
  if (kp) targets[kp.id] = keeperLineSpot(world, def);

  // Outfielders line the edge of the box; the attacking keeper stays home (formation fallback).
  const edge = latFrom(def, PENALTY.boxLat + 0.05);
  const others = world.players.filter((p) => !excluded.has(p.id) && p.role !== Role.GK);
  others.forEach((p, i) => {
    const depth = 0.15 + (i / Math.max(1, others.length - 1)) * 0.7;
    targets[p.id] = pointOnField(size, edge, depth);
  });
  return targets;
}

/** Free kick: a defensive wall between ball and goal, keeper on his line, two short options nearby. */
function freeKickTargets(world: RealGkWorld, r: RestartState, excluded: Set<number>): Record<number, Vec2> {
  const { size } = world;
  const def = opposite(r.team);
  const targets: Record<number, Vec2> = {};
  const kp = keeperOf(world, def);
  if (kp) targets[kp.id] = keeperLineSpot(world, def);

  const goal = goalCenterForTeam(size, def);
  const dx = goal.x - r.spot.x;
  const dy = goal.y - r.spot.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const wallDist = Math.min(WALL_MAX_DIST, len * 0.42);
  const wallers = outfield(world, def, excluded)
    .sort((a, b) => dist(a, r.spot) - dist(b, r.spot))
    .slice(0, WALL_SIZE);
  wallers.forEach((p, i) => {
    const off = (i - (WALL_SIZE - 1) / 2) * WALL_SPACING;
    targets[p.id] = { x: r.spot.x + nx * wallDist - ny * off, y: r.spot.y + ny * wallDist + nx * off };
  });

  const mates = outfield(world, r.team, excluded)
    .sort((a, b) => dist(a, r.spot) - dist(b, r.spot))
    .slice(0, 2);
  mates.forEach((p, i) => {
    const side = i === 0 ? 1 : -1;
    targets[p.id] = { x: r.spot.x - ny * side * 70 + nx * 30, y: r.spot.y + nx * side * 70 + ny * 30 };
  });
  return targets;
}

/** Goal kick: the kicking team pushes up to show for the outlet, opponents drop off toward their half. */
function goalKickTargets(world: RealGkWorld, r: RestartState, excluded: Set<number>): Record<number, Vec2> {
  const { size } = world;
  const away = r.team === Team.Blue ? 1 : -1; // shift away from the defended goal line
  const targets: Record<number, Vec2> = {};
  for (const p of world.players) {
    if (excluded.has(p.id) || p.role === Role.GK) continue;
    const shift = p.team === r.team ? 0.05 : 0.12;
    targets[p.id] = pointOnField(size, clamp(p.homeLat + away * shift, 0.05, 0.95), p.homeDepth);
  }
  return targets;
}

/** Throw-in: two teammates come short to offer options; crowding opponents back off the spot. */
function throwInTargets(world: RealGkWorld, r: RestartState, excluded: Set<number>): Record<number, Vec2> {
  const { size } = world;
  const targets: Record<number, Vec2> = {};
  const ratios = fieldRatios(size, r.spot.x, r.spot.y);
  const inward = ratios.depth < 0.5 ? 1 : -1; // offer infield of the crossed touchline
  const mates = outfield(world, r.team, excluded)
    .sort((a, b) => dist(a, r.spot) - dist(b, r.spot))
    .slice(0, 2);
  mates.forEach((p, i) => {
    const side = i === 0 ? 0.06 : -0.06;
    targets[p.id] = pointOnField(size, clamp(ratios.lat + side, 0.05, 0.95), clamp(ratios.depth + inward * 0.16, 0.08, 0.92));
  });
  for (const opp of outfield(world, opposite(r.team), excluded)) {
    if (dist(opp, r.spot) < 80) {
      const or = fieldRatios(size, opp.x, opp.y);
      targets[opp.id] = pointOnField(size, or.lat, clamp(or.depth + inward * 0.14, 0.08, 0.92));
    }
  }
  return targets;
}

/**
 * Per-player set-piece positions for a placed dead ball. Computed once at Setup so targets are stable;
 * players without an entry ease back to their formation home. The taker and a sent-off offender are
 * excluded (they are routed separately by the restart loop).
 */
export function computeRestartTargets(world: RealGkWorld, r: RestartState): Record<number, Vec2> {
  const excluded = new Set<number>();
  if (r.takerId !== null) excluded.add(r.takerId);
  if (r.foul?.card) excluded.add(r.foul.offenderId);
  switch (r.kind) {
    case RestartKind.Corner:
      return cornerTargets(world, r, excluded);
    case RestartKind.Penalty:
      return penaltyTargets(world, r, excluded);
    case RestartKind.FreeKick:
      return freeKickTargets(world, r, excluded);
    case RestartKind.GoalKick:
      return goalKickTargets(world, r, excluded);
    default:
      return throwInTargets(world, r, excluded);
  }
}
