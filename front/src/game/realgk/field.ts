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
    topY: height * 0.346,
    bottomY: height * 0.697,
    topLeft: width * 0.239,
    topRight: width * 0.759,
    bottomLeft: width * 0.137,
    bottomRight: width * 0.864,
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
  [Team.Blue]: { lat: 0.0, depthTop: 0.24, depthBottom: 0.548 },
  [Team.Red]: { lat: 1.0, depthTop: 0.241, depthBottom: 0.539 },
};

export function goalCenterForTeam(size: Size, team: Team): Vec2 {
  const g = GOALS[team];
  return pointOnField(size, g.lat, (g.depthTop + g.depthBottom) * 0.5);
}
