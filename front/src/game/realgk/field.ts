import { Team } from './enums';
import type { Size, Vec2 } from './types';
import { clamp, lerp } from './util';

export interface Metrics {
  width: number;
  height: number;
  topY: number;
  bottomY: number;
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

export interface Bounds {
  left: number;
  right: number;
  depth: number;
  topY: number;
  bottomY: number;
}

/** Trapezoid pitch aligned to the v1 court image corners (calibrated via /sandbox/field-calibrator). */
export function metrics(size: Size): Metrics {
  const { width, height } = size;
  return {
    width,
    height,
    topY: height * 0.341,
    bottomY: height * 0.708,
    topLeft: width * 0.24,
    topRight: width * 0.759,
    bottomLeft: width * 0.132,
    bottomRight: width * 0.871,
  };
}

export function fieldBounds(size: Size, y: number): Bounds {
  const m = metrics(size);
  const t = clamp((y - m.topY) / (m.bottomY - m.topY), 0, 1);
  return {
    left: lerp(m.topLeft, m.bottomLeft, t),
    right: lerp(m.topRight, m.bottomRight, t),
    depth: t,
    topY: m.topY,
    bottomY: m.bottomY,
  };
}

export function pointOnField(size: Size, lat: number, depth: number): Vec2 {
  const m = metrics(size);
  const y = lerp(m.topY, m.bottomY, depth);
  const bounds = fieldBounds(size, y);
  return { x: lerp(bounds.left, bounds.right, lat), y };
}

export function fieldRatios(size: Size, x: number, y: number): { lat: number; depth: number } {
  const m = metrics(size);
  const depth = clamp((y - m.topY) / (m.bottomY - m.topY), 0, 1);
  const bounds = fieldBounds(size, y);
  const lat = clamp((x - bounds.left) / Math.max(1, bounds.right - bounds.left), 0, 1);
  return { lat, depth };
}

/** Goal-mouth geometry per team's OWN goal, in field ratios (calibrated via /sandbox/field-calibrator). */
export interface GoalGeom {
  /** Lateral position of the goal line (Blue defends the left ≈ 0, Red the right ≈ 1). */
  lat: number;
  /** Top-post and bottom-post depth — the vertical band the ball must be within to score. */
  depthTop: number;
  depthBottom: number;
}

/** Crossbar height: a ball higher than this sails over instead of scoring. */
export const GOAL_MAX_Z = 24;

export const GOALS: Record<Team, GoalGeom> = {
  [Team.Blue]: { lat: 0.002, depthTop: 0.359, depthBottom: 0.527 },
  [Team.Red]: { lat: 0.996, depthTop: 0.359, depthBottom: 0.627 },
};

export function goalCenterForTeam(size: Size, team: Team): Vec2 {
  const g = GOALS[team];
  return pointOnField(size, g.lat, (g.depthTop + g.depthBottom) * 0.5);
}

/**
 * Field-ratio spots for dead-ball restarts (v5 deadBallSequence). Tuned to the painted court markings via
 * `/sandbox/field-calibrator`; `lat` is measured from the team's OWN goal line (Blue ≈ 0, Red ≈ 1).
 */
export const RESTART = {
  /** Corner flag: ON the goal-line/touchline intersection (hair inside PLAY_LINES so the ball reads in play). */
  cornerLatInset: 0.004,
  cornerDepthTop: 0.015,
  cornerDepthBottom: 0.958,
  /** Throw-in: ON the crossed touchline. */
  throwDepthTop: 0.012,
  throwDepthBottom: 0.955,
  /** Goal kick: inside the goal area, at its top/bottom corner. */
  goalKickLat: 0.12,
  goalKickDepthTop: 0.4,
  goalKickDepthBottom: 0.6,
};

/**
 * Penalty geometry in field ratios (approximated to the painted box; `lat` measured from the
 * defending team's OWN goal line, like RESTART).
 */
export const PENALTY = {
  /** Penalty spot distance from the goal line. */
  spotLat: 0.15,
  /** Box edge distance from the goal line (fouls inside it award a penalty). */
  boxLat: 0.25,
  boxDepthTop: 0.12,
  boxDepthBottom: 0.68,
};

/** Penalty spot in front of `defendTeam`'s own goal, aligned to the goal-mouth center. */
export function penaltySpot(size: Size, defendTeam: Team): Vec2 {
  const g = GOALS[defendTeam];
  const lat = defendTeam === Team.Blue ? PENALTY.spotLat : 1 - PENALTY.spotLat;
  return pointOnField(size, lat, (g.depthTop + g.depthBottom) * 0.5);
}

/** True when (x, y) sits inside `defendTeam`'s own penalty box. */
export function inPenaltyBox(size: Size, defendTeam: Team, x: number, y: number): boolean {
  const r = fieldRatios(size, x, y);
  const latFromGoal = defendTeam === Team.Blue ? r.lat : 1 - r.lat;
  return latFromGoal <= PENALTY.boxLat && r.depth >= PENALTY.boxDepthTop && r.depth <= PENALTY.boxDepthBottom;
}

/** Painted center spot in field ratios (calibrated via /sandbox/field-calibrator). */
export const CENTER = { lat: 0.501, depth: 0.434 };

/**
 * Playing lines where the ball is OUT, in field ratios of the trapezoid (calibrated via
 * /sandbox/field-calibrator). Defaults ≈ the old pixel fudge (goal lines ±6px, touchlines ±4px).
 */
export const PLAY_LINES = {
  latLeft: 0.001,
  latRight: 0.995,
  depthTop: 0.01,
  // Pulled in from the traced 0.99: the court art's bottom rows (covered seats, pinned at lat ~0.25 /
  // ~0.75, depth 1.0) overlap the trapezoid base — play stops before the ball reads as "on the stands".
  depthBottom: 0.965,
};

/** Halfway spot — the kickoff / mapping "center" reference (the painted center circle). */
export function centerSpot(size: Size): Vec2 {
  return pointOnField(size, CENTER.lat, CENTER.depth);
}

/** Throw-in restart point: lateral where the ball left, on the crossed touchline (top or bottom). */
export function throwInSpot(size: Size, x: number, y: number, top: boolean): Vec2 {
  const lat = clamp(fieldRatios(size, x, y).lat, 0.06, 0.94);
  return pointOnField(size, lat, top ? RESTART.throwDepthTop : RESTART.throwDepthBottom);
}

/** Corner restart point on the flank the ball crossed — fixes the old "always near corner" bug. */
export function cornerSpot(size: Size, defendTeam: Team, top: boolean): Vec2 {
  const lat = defendTeam === Team.Blue ? RESTART.cornerLatInset : 1 - RESTART.cornerLatInset;
  return pointOnField(size, lat, top ? RESTART.cornerDepthTop : RESTART.cornerDepthBottom);
}

/** Goal-kick restart point inside the defending team's goal area (top/bottom corner). */
export function goalKickSpot(size: Size, defendTeam: Team, top: boolean): Vec2 {
  const lat = defendTeam === Team.Blue ? RESTART.goalKickLat : 1 - RESTART.goalKickLat;
  return pointOnField(size, lat, top ? RESTART.goalKickDepthTop : RESTART.goalKickDepthBottom);
}
