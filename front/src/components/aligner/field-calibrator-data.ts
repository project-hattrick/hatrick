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

/**
 * Goal frame in image ratios — the four corners of the goal in perspective. `base` points sit on the
 * goal line (post feet); `top` points are the post tops the crossbar spans. Replaces the old collapse-
 * to-band polyline so the full frame (two posts + crossbar) is drawn and kept, not flattened.
 */
export interface GoalFrame {
  /** Near post foot (closer to camera — bottom of the mouth). */
  nearBase: Pt;
  /** Far post foot (further away — top of the mouth). */
  farBase: Pt;
  /** Near post top (crossbar end above nearBase). */
  nearTop: Pt;
  /** Far post top (crossbar end above farBase). */
  farTop: Pt;
}

export type GoalHandle = keyof GoalFrame;
export const GOAL_HANDLES: GoalHandle[] = ['nearBase', 'farBase', 'nearTop', 'farTop'];

/** Everything the calibrator persists between sessions. */
export interface CalibratorState {
  corners: Corners;
  goals: Record<GoalSide, GoalFrame>;
  playLines: PlayLines;
  center: CenterPt;
  comments: CommentPin[];
}

/** Internal canvas resolution; the image is letterboxed inside preserving aspect. */
export const CANVAS_W = 1180;
export const CANVAS_H = 760;

/** Letterbox fit of the court image inside the canvas (contain). */
export interface Fit {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Canva-style viewport: scale + offset applied on top of the base canvas space. */
export interface View {
  zoom: number;
  x: number;
  y: number;
}

export type Mode = 'handles' | 'lines' | 'goal' | 'comment' | 'pen';
export type LineEdge = 'left' | 'right' | 'top' | 'bottom';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const fmt = (v: number) => v.toFixed(3);

/** Current engine values (realgk/field.ts metrics) as image-ratio corners — rain court, re-traced 11/07. */
export const DEFAULT_CORNERS: Corners = {
  tl: { x: 0.278, y: 0.337 },
  tr: { x: 0.717, y: 0.337 },
  bl: { x: 0.209, y: 0.709 },
  br: { x: 0.792, y: 0.709 },
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

/** Default post height (image-ratio Y) the crossbar sits above the base; far post a touch shorter. */
export const DEFAULT_CROSSBAR = 0.11;

/** Build a goal frame from a scoring band (lat + top/bottom post depth) + a crossbar height. */
export function frameFromBand(
  c: Corners,
  lat: number,
  depthTop: number,
  depthBottom: number,
  crossbar = DEFAULT_CROSSBAR,
): GoalFrame {
  const near = pointFor(c, lat, depthBottom); // bottom of the mouth = nearer the camera
  const far = pointFor(c, lat, depthTop);
  return {
    nearBase: near,
    farBase: far,
    nearTop: { x: near.x, y: near.y - crossbar },
    farTop: { x: far.x, y: far.y - crossbar * 0.78 }, // shorter in perspective; drag to taste
  };
}

/** Each goal starts as a frame around the engine's current GOALS band (rain court, re-traced 11/07). */
export const DEFAULT_GOALS: Record<GoalSide, GoalFrame> = {
  blue: frameFromBand(DEFAULT_CORNERS, 0.0, 0.363, 0.532),
  red: frameFromBand(DEFAULT_CORNERS, 0.996, 0.349, 0.526),
};

/** Current engine values (realgk/field.ts PLAY_LINES / CENTER) in lat/depth space. */
export const DEFAULT_PLAY_LINES: PlayLines = { latLeft: 0.001, latRight: 0.995, depthTop: 0.01, depthBottom: 0.99 };
export const DEFAULT_CENTER: CenterPt = { lat: 0.502, depth: 0.42 };

export const defaultCalibratorState = (): CalibratorState => ({
  corners: DEFAULT_CORNERS,
  goals: DEFAULT_GOALS,
  playLines: DEFAULT_PLAY_LINES,
  center: DEFAULT_CENTER,
  comments: [],
});

/** Drag handles for the out-of-play lines (edge midpoints) + the center spot, in image ratios. */
export function lineHandles(
  corners: Corners,
  playLines: PlayLines,
  center: CenterPt,
): { edge: LineEdge | 'center'; pt: Pt }[] {
  const midDepth = (playLines.depthTop + playLines.depthBottom) / 2;
  const midLat = (playLines.latLeft + playLines.latRight) / 2;
  return [
    { edge: 'left', pt: pointFor(corners, playLines.latLeft, midDepth) },
    { edge: 'right', pt: pointFor(corners, playLines.latRight, midDepth) },
    { edge: 'top', pt: pointFor(corners, midLat, playLines.depthTop) },
    { edge: 'bottom', pt: pointFor(corners, midLat, playLines.depthBottom) },
    { edge: 'center', pt: pointFor(corners, center.lat, center.depth) },
  ];
}

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
      blue: frameFromBand(corners, gb.lat, gb.depthTop, gb.depthBottom),
      red: frameFromBand(corners, gr.lat, gr.depthTop, gr.depthBottom),
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
  /** Crossbar height as an image-ratio Y (average of the two post heights). */
  crossbar: number;
  /** The four frame corners in lat/depth, for reference in the export. */
  corners: { key: GoalHandle; lat: number; depth: number }[];
}

/** Reduces a goal frame to the engine's goal-mouth band (+ crossbar height) and lists its corners. */
export function goalBand(c: Corners, frame: GoalFrame): GoalBand {
  const nb = ratioFor(c, frame.nearBase);
  const fb = ratioFor(c, frame.farBase);
  const lat = (nb.lat + fb.lat) / 2;
  const nearH = frame.nearBase.y - frame.nearTop.y;
  const farH = frame.farBase.y - frame.farTop.y;
  const crossbar = Math.max(0, (nearH + farH) / 2);
  return {
    lat,
    depthTop: Math.min(nb.depth, fb.depth),
    depthBottom: Math.max(nb.depth, fb.depth),
    crossbar,
    corners: GOAL_HANDLES.map((key) => ({ key, ...ratioFor(c, frame[key]) })),
  };
}

const STORAGE_KEY = 'hat-trick:field-calibrator:v2';

/** Handle colors/keys shared by the calibrator UI (kept here so the component stays under the size cap). */
export const CORNER_HANDLES: { key: CornerKey; color: string }[] = [
  { key: 'tl', color: '#38bdf8' },
  { key: 'tr', color: '#38bdf8' },
  { key: 'bl', color: '#22d3ee' },
  { key: 'br', color: '#22d3ee' },
];
export const GOAL_COLOR: Record<GoalSide, string> = { blue: '#60a5fa', red: '#fb7185' };
export const COMMENT_COLOR = '#f97316';

/** True when a persisted goals blob is the new frame shape (guards against old array traces). */
function isFrame(v: unknown): v is GoalFrame {
  return !!v && typeof v === 'object' && 'nearBase' in (v as object);
}

/** Sessions are saved per court (key), so mapping a new stadium never clobbers the rain-court trace. */
export function loadCalibratorState(key: string = STORAGE_KEY): CalibratorState | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CalibratorState>;
    const base = defaultCalibratorState();
    const goals =
      parsed.goals && isFrame(parsed.goals.blue) && isFrame(parsed.goals.red) ? parsed.goals : base.goals;
    return {
      corners: parsed.corners ?? base.corners,
      goals,
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

/** The engine `FieldSpec` for a calibrator state — the same numbers `buildSnippet` prints, as a live
 *  object. Feeds `handle.setField(...)` so dragging a handle remaps the pitch in real time. */
export function fieldSpecFromState(s: CalibratorState): FieldSpec {
  const { corners, playLines, center } = s;
  const blue = goalBand(corners, s.goals.blue);
  const red = goalBand(corners, s.goals.red);
  return {
    ratios: {
      topY: (corners.tl.y + corners.tr.y) / 2,
      bottomY: (corners.bl.y + corners.br.y) / 2,
      topLeft: corners.tl.x,
      topRight: corners.tr.x,
      bottomLeft: corners.bl.x,
      bottomRight: corners.br.x,
    },
    goals: {
      [Team.Blue]: { lat: blue.lat, depthTop: blue.depthTop, depthBottom: blue.depthBottom, crossbar: blue.crossbar },
      [Team.Red]: { lat: red.lat, depthTop: red.depthTop, depthBottom: red.depthBottom, crossbar: red.crossbar },
    },
    center: { lat: center.lat, depth: center.depth },
    playLines: {
      latLeft: playLines.latLeft,
      latRight: playLines.latRight,
      depthTop: playLines.depthTop,
      depthBottom: playLines.depthBottom,
    },
  };
}

/** Paste-ready field.ts values (+ the goal frames and pinned notes as comment lines). */
export function buildSnippet(s: CalibratorState): string {
  const { corners, playLines, center } = s;
  const topY = (corners.tl.y + corners.tr.y) / 2;
  const bottomY = (corners.bl.y + corners.br.y) / 2;
  const blue = goalBand(corners, s.goals.blue);
  const red = goalBand(corners, s.goals.red);
  const frameLine = (band: GoalBand) =>
    band.corners.map((p) => `${p.key} [${fmt(p.lat)}, ${fmt(p.depth)}]`).join(', ');
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
    blue: { lat: ${fmt(blue.lat)}, depthTop: ${fmt(blue.depthTop)}, depthBottom: ${fmt(blue.depthBottom)}, crossbar: ${fmt(blue.crossbar)} },
    red: { lat: ${fmt(red.lat)}, depthTop: ${fmt(red.depthTop)}, depthBottom: ${fmt(red.depthBottom)}, crossbar: ${fmt(red.crossbar)} },
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

// project/front/src/game/realgk/field.ts → GOALS (scoring band derived from the frame's post feet)
[Team.Blue]: { lat: ${fmt(blue.lat)}, depthTop: ${fmt(blue.depthTop)}, depthBottom: ${fmt(blue.depthBottom)} },
[Team.Red]:  { lat: ${fmt(red.lat)}, depthTop: ${fmt(red.depthTop)}, depthBottom: ${fmt(red.depthBottom)} },

// crossbar height as image-ratio Y (feed into GOAL_MAX_Z / a goalNet renderer): blue ${fmt(blue.crossbar)}, red ${fmt(red.crossbar)}

// project/front/src/game/realgk/field.ts → CENTER (kickoff / painted center circle)
export const CENTER = { lat: ${fmt(center.lat)}, depth: ${fmt(center.depth)} };

// project/front/src/game/realgk/field.ts → PLAY_LINES (where the ball is out)
export const PLAY_LINES = {
  latLeft: ${fmt(playLines.latLeft)},
  latRight: ${fmt(playLines.latRight)},
  depthTop: ${fmt(playLines.depthTop)},
  depthBottom: ${fmt(playLines.depthBottom)},
};

// goal frames (lat, depth per corner)
// blue: ${frameLine(blue)}
// red:  ${frameLine(red)}${noteLines ? `\n\n// pinned notes\n${noteLines}` : ''}`;
}
