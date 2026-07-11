/** Pure data, geometry and persistence helpers for the field calibrator (kept out of the component). */

import type { FieldSpec } from '@/game/realgk/field';
import { Team } from '@/game/realgk/enums';

export interface Pt {
  x: number;
  y: number;
}

export type CornerKey = 'tl' | 'tr' | 'bl' | 'br';
export type Corners = Record<CornerKey, Pt>;
export type GoalSide = 'blue' | 'red';

export interface PlayLines {
  latLeft: number;
  latRight: number;
  depthTop: number;
  depthBottom: number;
}

export interface CenterPt {
  lat: number;
  depth: number;
}

/** A numbered note pinned to a spot on the court (image ratios). */
export interface CommentPin {
  id: number;
  x: number;
  y: number;
  text: string;
}

/** Everything the calibrator persists between sessions. */
export interface CalibratorState {
  corners: Corners;
  goals: Record<GoalSide, Pt[]>;
  playLines: PlayLines;
  center: CenterPt;
  comments: CommentPin[];
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const fmt = (v: number) => v.toFixed(3);

/** Current engine values (realgk/field.ts metrics) as image-ratio corners. */
export const DEFAULT_CORNERS: Corners = {
  tl: { x: 0.239, y: 0.346 },
  tr: { x: 0.759, y: 0.346 },
  bl: { x: 0.137, y: 0.697 },
  br: { x: 0.864, y: 0.697 },
};

/** Turn a lat/depth (engine coords) into an image-ratio point on the given trapezoid. */
export function pointFor(c: Corners, lat: number, depth: number): Pt {
  const y = c.tl.y + (c.bl.y - c.tl.y) * depth;
  const left = c.tl.x + (c.bl.x - c.tl.x) * depth;
  const right = c.tr.x + (c.br.x - c.tr.x) * depth;
  return { x: left + (right - left) * lat, y };
}

/** Image-ratio point → lat/depth on the given trapezoid. */
export function ratioFor(c: Corners, pt: Pt): { lat: number; depth: number } {
  const topY = (c.tl.y + c.tr.y) / 2;
  const bottomY = (c.bl.y + c.br.y) / 2;
  const depth = clamp01((pt.y - topY) / Math.max(1e-4, bottomY - topY));
  const left = c.tl.x + (c.bl.x - c.tl.x) * depth;
  const right = c.tr.x + (c.br.x - c.tr.x) * depth;
  return { lat: clamp01((pt.x - left) / Math.max(1e-4, right - left)), depth };
}

/** Each goal starts as its two posts (seeded from the engine's current GOALS bands). */
export const DEFAULT_GOALS: Record<GoalSide, Pt[]> = {
  blue: [pointFor(DEFAULT_CORNERS, 0.0, 0.36), pointFor(DEFAULT_CORNERS, 0.0, 0.535)],
  red: [pointFor(DEFAULT_CORNERS, 1.0, 0.36), pointFor(DEFAULT_CORNERS, 1.0, 0.64)],
};

/** Current engine values (realgk/field.ts PLAY_LINES / CENTER) in lat/depth space. */
export const DEFAULT_PLAY_LINES: PlayLines = { latLeft: 0.001, latRight: 0.995, depthTop: 0.01, depthBottom: 0.99 };
export const DEFAULT_CENTER: CenterPt = { lat: 0.501, depth: 0.434 };

export const defaultCalibratorState = (): CalibratorState => ({
  corners: DEFAULT_CORNERS,
  goals: DEFAULT_GOALS,
  playLines: DEFAULT_PLAY_LINES,
  center: DEFAULT_CENTER,
  comments: [],
});

/**
 * Seeds the calibrator from a config's `field` spec, so an already-mapped court (e.g. franca) opens
 * ALIGNED with what the game currently uses instead of the rain-court defaults. Groups the spec
 * omits fall back to the engine defaults, drawn on the spec's own trapezoid.
 */
export function stateFromFieldSpec(spec: FieldSpec): CalibratorState {
  const base = defaultCalibratorState();
  const r = spec.ratios ?? {};
  const corners: Corners = {
    tl: { x: r.topLeft ?? base.corners.tl.x, y: r.topY ?? base.corners.tl.y },
    tr: { x: r.topRight ?? base.corners.tr.x, y: r.topY ?? base.corners.tr.y },
    bl: { x: r.bottomLeft ?? base.corners.bl.x, y: r.bottomY ?? base.corners.bl.y },
    br: { x: r.bottomRight ?? base.corners.br.x, y: r.bottomY ?? base.corners.br.y },
  };
  const gb = { lat: 0.0, depthTop: 0.36, depthBottom: 0.535, ...spec.goals?.[Team.Blue] };
  const gr = { lat: 1.0, depthTop: 0.36, depthBottom: 0.64, ...spec.goals?.[Team.Red] };
  return {
    corners,
    goals: {
      blue: [pointFor(corners, gb.lat, gb.depthTop), pointFor(corners, gb.lat, gb.depthBottom)],
      red: [pointFor(corners, gr.lat, gr.depthTop), pointFor(corners, gr.lat, gr.depthBottom)],
    },
    playLines: { ...base.playLines, ...spec.playLines },
    center: { ...base.center, ...spec.center },
    comments: [],
  };
}

export interface GoalBand {
  lat: number;
  depthTop: number;
  depthBottom: number;
  points: { lat: number; depth: number }[];
}

/** Reduces the traced goal points to the engine's goal-mouth band. */
export function goalBand(c: Corners, pts: Pt[], side: GoalSide): GoalBand {
  const rs = pts.map((p) => ratioFor(c, p));
  if (!rs.length) return { lat: side === 'blue' ? 0 : 1, depthTop: 0.36, depthBottom: 0.64, points: rs };
  const depths = rs.map((r) => r.depth);
  const lat = rs.reduce((s, r) => s + r.lat, 0) / rs.length;
  return { lat, depthTop: Math.min(...depths), depthBottom: Math.max(...depths), points: rs };
}

const STORAGE_KEY = 'hat-trick:field-calibrator:v1';

/** Handle colors/keys shared by the calibrator UI (kept here so the component stays under the size cap). */
export const CORNER_HANDLES: { key: CornerKey; color: string }[] = [
  { key: 'tl', color: '#38bdf8' },
  { key: 'tr', color: '#38bdf8' },
  { key: 'bl', color: '#22d3ee' },
  { key: 'br', color: '#22d3ee' },
];
export const GOAL_COLOR: Record<GoalSide, string> = { blue: '#60a5fa', red: '#fb7185' };
export const COMMENT_COLOR = '#f97316';

/** Sessions are saved per court (key), so mapping a new stadium never clobbers the rain-court trace. */
export function loadCalibratorState(key: string = STORAGE_KEY): CalibratorState | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CalibratorState>;
    const base = defaultCalibratorState();
    return {
      corners: parsed.corners ?? base.corners,
      goals: parsed.goals ?? base.goals,
      playLines: parsed.playLines ?? base.playLines,
      center: parsed.center ?? base.center,
      comments: parsed.comments ?? base.comments,
    };
  } catch {
    return null;
  }
}

export function saveCalibratorState(state: CalibratorState, key: string = STORAGE_KEY): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage full/blocked — the tool still works, it just won't persist.
  }
}

export function clearCalibratorState(key: string = STORAGE_KEY): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore — nothing to clear.
  }
}

/** Paste-ready field.ts values (+ the pinned notes as comment lines). */
export function buildSnippet(s: CalibratorState): string {
  const { corners, playLines, center } = s;
  const topY = (corners.tl.y + corners.tr.y) / 2;
  const bottomY = (corners.bl.y + corners.br.y) / 2;
  const blue = goalBand(corners, s.goals.blue, 'blue');
  const red = goalBand(corners, s.goals.red, 'red');
  const ptsLine = (band: GoalBand) => `[${band.points.map((p) => `[${fmt(p.lat)}, ${fmt(p.depth)}]`).join(', ')}]`;
  const noteLines = s.comments
    .map((cm, i) => {
      const r = ratioFor(corners, cm);
      return `// 📍 ${i + 1} (lat ${fmt(r.lat)}, depth ${fmt(r.depth)}): ${cm.text || '(no text)'}`;
    })
    .join('\n');

  return `// RealGkConfig.field — per-court override, paste into the court's config
// (e.g. FRANCE_STADIUM_FIELD in realgk/config.ts). Unset groups keep rain-court defaults.
field: {
  ratios: { topY: ${fmt(topY)}, bottomY: ${fmt(bottomY)}, topLeft: ${fmt(corners.tl.x)}, topRight: ${fmt(corners.tr.x)}, bottomLeft: ${fmt(corners.bl.x)}, bottomRight: ${fmt(corners.br.x)} },
  goals: {
    blue: { lat: ${fmt(blue.lat)}, depthTop: ${fmt(blue.depthTop)}, depthBottom: ${fmt(blue.depthBottom)} },
    red: { lat: ${fmt(red.lat)}, depthTop: ${fmt(red.depthTop)}, depthBottom: ${fmt(red.depthBottom)} },
  },
  center: { lat: ${fmt(center.lat)}, depth: ${fmt(center.depth)} },
  playLines: { latLeft: ${fmt(playLines.latLeft)}, latRight: ${fmt(playLines.latRight)}, depthTop: ${fmt(playLines.depthTop)}, depthBottom: ${fmt(playLines.depthBottom)} },
},

// project/front/src/game/realgk/field.ts → metrics() (GLOBAL default — only for the rain-court)
topY: height * ${fmt(topY)},
bottomY: height * ${fmt(bottomY)},
topLeft: width * ${fmt(corners.tl.x)},
topRight: width * ${fmt(corners.tr.x)},
bottomLeft: width * ${fmt(corners.bl.x)},
bottomRight: width * ${fmt(corners.br.x)},

// project/front/src/game/realgk/field.ts → GOALS (band derived from traced points)
[Team.Blue]: { lat: ${fmt(blue.lat)}, depthTop: ${fmt(blue.depthTop)}, depthBottom: ${fmt(blue.depthBottom)} },
[Team.Red]:  { lat: ${fmt(red.lat)}, depthTop: ${fmt(red.depthTop)}, depthBottom: ${fmt(red.depthBottom)} },

// project/front/src/game/realgk/field.ts → CENTER (kickoff / painted center circle)
export const CENTER = { lat: ${fmt(center.lat)}, depth: ${fmt(center.depth)} };

// project/front/src/game/realgk/field.ts → PLAY_LINES (where the ball is out)
export const PLAY_LINES = {
  latLeft: ${fmt(playLines.latLeft)},
  latRight: ${fmt(playLines.latRight)},
  depthTop: ${fmt(playLines.depthTop)},
  depthBottom: ${fmt(playLines.depthBottom)},
};

// traced goal points [lat, depth] (${blue.points.length} blue, ${red.points.length} red)
// blue: ${ptsLine(blue)}
// red:  ${ptsLine(red)}${noteLines ? `\n\n// pinned notes\n${noteLines}` : ''}`;
}
