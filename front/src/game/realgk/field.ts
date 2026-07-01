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

/** Trapezoid pitch aligned to the v1 court image corners (same background + area delimitation). */
export function metrics(size: Size): Metrics {
  const { width, height } = size;
  return {
    width,
    height,
    topY: height * 0.346,
    bottomY: height * 0.708,
    topLeft: width * 0.218,
    topRight: width * 0.782,
    bottomLeft: width * 0.116,
    bottomRight: width * 0.884,
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

export function goalCenterForTeam(size: Size, team: Team): Vec2 {
  return pointOnField(size, team === Team.Blue ? 0.03 : 0.97, 0.5);
}
