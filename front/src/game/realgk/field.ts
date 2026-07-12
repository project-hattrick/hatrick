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

/** Pitch trapezoid as image fractions — the 6 numbers /sandbox/field-calibrator traces. */
export interface FieldRatios {
  topY: number;
  bottomY: number;
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

/**
 * Per-court field mapping a RealGkConfig can carry (`config.field`). Anything omitted keeps the
 * calibrated v1 rain-court defaults below.
 */
export interface FieldSpec {
  ratios?: Partial<FieldRatios>;
  goals?: Partial<Record<Team, Partial<GoalGeom>>>;
  center?: Partial<{ lat: number; depth: number }>;
  playLines?: Partial<typeof DEFAULT_PLAY_LINES>;
}

/** v1 rain-court trapezoid (calibrated via /sandbox/field-calibrator) — the default mapping. */
const DEFAULT_RATIOS: FieldRatios = { topY: 0.337, bottomY: 0.709, topLeft: 0.278, topRight: 0.717, bottomLeft: 0.209, bottomRight: 0.792 };

let RATIOS: FieldRatios = { ...DEFAULT_RATIOS };

/**
 * Applies a court's field mapping — called by the engine with `config.field` on creation, so each
 * arena maps its own art. Module-level (like the live FRAME_CONFIG maps): the last engine created
 * on a page wins, which holds as long as pages run one court at a time.
 */
export function setFieldSpec(spec?: FieldSpec): void {
  RATIOS = { ...DEFAULT_RATIOS, ...spec?.ratios };
  Object.assign(GOALS[Team.Blue], DEFAULT_GOALS[Team.Blue], spec?.goals?.[Team.Blue]);
  Object.assign(GOALS[Team.Red], DEFAULT_GOALS[Team.Red], spec?.goals?.[Team.Red]);
  Object.assign(CENTER, DEFAULT_CENTER, spec?.center);
  Object.assign(PLAY_LINES, DEFAULT_PLAY_LINES, spec?.playLines);
}

/** Trapezoid pitch aligned to the active court's corners (see `setFieldSpec`). */
export function metrics(size: Size): Metrics {
  const { width, height } = size;
  return {
    width,
    height,
    topY: height * RATIOS.topY,
    bottomY: height * RATIOS.bottomY,
    topLeft: width * RATIOS.topLeft,
    topRight: width * RATIOS.topRight,
    bottomLeft: width * RATIOS.bottomLeft,
    bottomRight: width * RATIOS.bottomRight,
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
  /** Post/crossbar height as an image-ratio Y (fraction of court height), traced in the calibrator.
   *  Drives the `goalFrame` renderer's posts; omit to keep the default. */
  crossbar?: number;
}

/** Crossbar height: a ball higher than this sails over instead of scoring. */
export const GOAL_MAX_Z = 24;

/** v1 rain-court goal bands — defaults `setFieldSpec` merges court overrides onto. */
const DEFAULT_GOALS: Record<Team, GoalGeom> = {
  [Team.Blue]: { lat: 0.0, depthTop: 0.363, depthBottom: 0.532, crossbar: 0.098 },
  [Team.Red]: { lat: 0.996, depthTop: 0.349, depthBottom: 0.526, crossbar: 0.098 },
};

export const GOALS: Record<Team, GoalGeom> = {
  [Team.Blue]: { ...DEFAULT_GOALS[Team.Blue] },
  [Team.Red]: { ...DEFAULT_GOALS[Team.Red] },
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
const DEFAULT_CENTER = { lat: 0.502, depth: 0.42 };
export const CENTER = { ...DEFAULT_CENTER };

/**
 * Playing lines where the ball is OUT, in field ratios of the trapezoid (calibrated via
 * /sandbox/field-calibrator). Defaults ≈ the old pixel fudge (goal lines ±6px, touchlines ±4px).
 */
const DEFAULT_PLAY_LINES = {
  latLeft: 0.001,
  latRight: 0.995,
  depthTop: 0.01,
  // Re-traced 11/07 to the room court's grass base. If the ball ever reads in-play over the
  // covered-seat rows that overlap the trapezoid base near depth 1.0, pull this back in (was 0.965).
  depthBottom: 0.99,
};
export const PLAY_LINES = { ...DEFAULT_PLAY_LINES };

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
