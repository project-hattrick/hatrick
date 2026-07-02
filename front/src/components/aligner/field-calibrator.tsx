'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Court image the engine paints each frame (see realgk/render.ts COURT_BG). */
const COURT_SRC = '/game/stadiums/rain-court/court.png';
/** Internal canvas resolution; the image is letterboxed inside preserving aspect (the engine measures
 *  ratios of the image itself, so we must never distort it here). */
const CANVAS_W = 1180;
const CANVAS_H = 760;
const HIT_R = 14;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const fmt = (v: number) => v.toFixed(3);

interface Pt {
  x: number;
  y: number;
}

type Mode = 'handles' | 'goal' | 'pen';
type GoalSide = 'blue' | 'red';

/** Current engine values (realgk/field.ts metrics) as image-ratio corners. */
const DEFAULT_CORNERS = {
  tl: { x: 0.239, y: 0.346 },
  tr: { x: 0.759, y: 0.346 },
  bl: { x: 0.137, y: 0.697 },
  br: { x: 0.864, y: 0.697 },
};
type CornerKey = keyof typeof DEFAULT_CORNERS;

/** Turn a lat/depth (engine coords) into an image-ratio point on the current trapezoid. */
function pointFor(c: typeof DEFAULT_CORNERS, lat: number, depth: number): Pt {
  const y = c.tl.y + (c.bl.y - c.tl.y) * depth;
  const left = c.tl.x + (c.bl.x - c.tl.x) * depth;
  const right = c.tr.x + (c.br.x - c.tr.x) * depth;
  return { x: left + (right - left) * lat, y };
}

/** Each goal starts as its two posts; add/drag more points in Goal mode to trace the drawn mouth. */
const DEFAULT_GOALS: Record<GoalSide, Pt[]> = {
  blue: [pointFor(DEFAULT_CORNERS, 0.0, 0.36), pointFor(DEFAULT_CORNERS, 0.0, 0.64)],
  red: [pointFor(DEFAULT_CORNERS, 1.0, 0.36), pointFor(DEFAULT_CORNERS, 1.0, 0.64)],
};

const CORNER_HANDLES: { key: CornerKey; color: string }[] = [
  { key: 'tl', color: '#38bdf8' },
  { key: 'tr', color: '#38bdf8' },
  { key: 'bl', color: '#22d3ee' },
  { key: 'br', color: '#22d3ee' },
];

const GOAL_COLOR: Record<GoalSide, string> = { blue: '#60a5fa', red: '#fb7185' };

type Drag = { type: 'corner'; key: CornerKey } | { type: 'goal'; side: GoalSide; index: number } | null;

interface Fit {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Dev tool: trace the court's trapezoid, goal mouths (multi-point) + read back the field.ts ratios. */
export function FieldCalibrator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fitRef = useRef<Fit>({ x: 0, y: 0, w: CANVAS_W, h: CANVAS_H });

  const [corners, setCorners] = useState(DEFAULT_CORNERS);
  const [goals, setGoals] = useState<Record<GoalSide, Pt[]>>(DEFAULT_GOALS);
  const [mode, setMode] = useState<Mode>('handles');
  const [activeGoal, setActiveGoal] = useState<GoalSide>('blue');
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [loaded, setLoaded] = useState(false);

  const drag = useRef<Drag>(null);
  const penning = useRef(false);

  // Load the court once, computing the letterbox fit (contain).
  useEffect(() => {
    const img = new Image();
    img.src = COURT_SRC;
    img.onload = () => {
      imgRef.current = img;
      const scale = Math.min(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      fitRef.current = { x: (CANVAS_W - w) / 2, y: (CANVAS_H - h) / 2, w, h };
      setLoaded(true);
    };
  }, []);

  const toCanvas = useCallback((r: Pt): Pt => {
    const f = fitRef.current;
    return { x: f.x + r.x * f.w, y: f.y + r.y * f.h };
  }, []);

  const toRatio = useCallback((cx: number, cy: number): Pt => {
    const f = fitRef.current;
    return { x: clamp01((cx - f.x) / f.w), y: clamp01((cy - f.y) / f.h) };
  }, []);

  // Redraw everything on any state change.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !imgRef.current) return;
    const f = fitRef.current;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(imgRef.current, f.x, f.y, f.w, f.h);

    // Trapezoid fill + outline.
    const cp = (k: CornerKey) => toCanvas(corners[k]);
    const tl = cp('tl');
    const tr = cp('tr');
    const br = cp('br');
    const bl = cp('bl');
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(56,189,248,0.12)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Goal polylines + points.
    (['blue', 'red'] as GoalSide[]).forEach((side) => {
      const pts = goals[side];
      const isActive = mode === 'goal' && side === activeGoal;
      if (pts.length >= 2) {
        ctx.strokeStyle = GOAL_COLOR[side];
        ctx.lineWidth = isActive ? 5 : 4;
        ctx.beginPath();
        pts.forEach((r, i) => {
          const c = toCanvas(r);
          if (i === 0) ctx.moveTo(c.x, c.y);
          else ctx.lineTo(c.x, c.y);
        });
        ctx.stroke();
      }
      pts.forEach((r) => {
        const c = toCanvas(r);
        ctx.beginPath();
        ctx.arc(c.x, c.y, isActive ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = GOAL_COLOR[side];
        ctx.fill();
        ctx.strokeStyle = '#0b1020';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // Freehand pen strokes.
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const s of strokes) {
      if (s.length < 2) continue;
      ctx.beginPath();
      s.forEach((pt, i) => {
        const c = toCanvas(pt);
        if (i === 0) ctx.moveTo(c.x, c.y);
        else ctx.lineTo(c.x, c.y);
      });
      ctx.stroke();
    }

    // Corner handles (only meaningful in handles mode; dimmed otherwise).
    ctx.globalAlpha = mode === 'handles' ? 1 : 0.4;
    for (const h of CORNER_HANDLES) {
      const c = toCanvas(corners[h.key]);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = h.color;
      ctx.fill();
      ctx.strokeStyle = '#0b1020';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [corners, goals, strokes, loaded, mode, activeGoal, toCanvas]);

  const eventRatio = (e: React.PointerEvent<HTMLCanvasElement>): { cx: number; cy: number; ratio: Pt } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const cy = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    return { cx, cy, ratio: toRatio(cx, cy) };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { cx, cy, ratio } = eventRatio(e);
    canvasRef.current?.setPointerCapture(e.pointerId);

    if (mode === 'pen') {
      penning.current = true;
      setStrokes((s) => [...s, [ratio]]);
      return;
    }

    if (mode === 'handles') {
      let best: CornerKey | null = null;
      let bestD = HIT_R * HIT_R;
      for (const h of CORNER_HANDLES) {
        const c = toCanvas(corners[h.key]);
        const d = (c.x - cx) ** 2 + (c.y - cy) ** 2;
        if (d < bestD) {
          bestD = d;
          best = h.key;
        }
      }
      drag.current = best ? { type: 'corner', key: best } : null;
      return;
    }

    // Goal mode: grab the nearest point of the active goal, else append a new one.
    const pts = goals[activeGoal];
    let hit = -1;
    let bestD = HIT_R * HIT_R;
    pts.forEach((r, i) => {
      const c = toCanvas(r);
      const d = (c.x - cx) ** 2 + (c.y - cy) ** 2;
      if (d < bestD) {
        bestD = d;
        hit = i;
      }
    });
    if (hit >= 0) {
      drag.current = { type: 'goal', side: activeGoal, index: hit };
    } else {
      const index = pts.length;
      setGoals((g) => ({ ...g, [activeGoal]: [...g[activeGoal], ratio] }));
      drag.current = { type: 'goal', side: activeGoal, index };
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penning.current && !drag.current) return;
    const { ratio } = eventRatio(e);
    if (penning.current) {
      setStrokes((s) => {
        const next = s.slice();
        next[next.length - 1] = [...next[next.length - 1], ratio];
        return next;
      });
      return;
    }
    const d = drag.current!;
    if (d.type === 'corner') {
      setCorners((c) => ({ ...c, [d.key]: ratio }));
    } else {
      setGoals((g) => {
        const list = g[d.side].slice();
        list[d.index] = ratio;
        return { ...g, [d.side]: list };
      });
    }
  };

  const onUp = () => {
    penning.current = false;
    drag.current = null;
  };

  const undoPoint = () => setGoals((g) => ({ ...g, [activeGoal]: g[activeGoal].slice(0, -1) }));
  const clearGoal = () => setGoals((g) => ({ ...g, [activeGoal]: [] }));
  const resetAll = () => {
    setCorners(DEFAULT_CORNERS);
    setGoals(DEFAULT_GOALS);
  };

  // Derived engine values. Top/bottom Y are the shared edges (average of the two corners).
  const topY = (corners.tl.y + corners.tr.y) / 2;
  const bottomY = (corners.bl.y + corners.br.y) / 2;
  const ratioFor = (pt: Pt): { lat: number; depth: number } => {
    const depth = clamp01((pt.y - topY) / Math.max(1e-4, bottomY - topY));
    const left = corners.tl.x + (corners.bl.x - corners.tl.x) * depth;
    const right = corners.tr.x + (corners.br.x - corners.tr.x) * depth;
    return { lat: clamp01((pt.x - left) / Math.max(1e-4, right - left)), depth };
  };

  const goalBand = (side: GoalSide) => {
    const rs = goals[side].map(ratioFor);
    if (!rs.length) return { lat: side === 'blue' ? 0 : 1, depthTop: 0.36, depthBottom: 0.64, points: rs };
    const depths = rs.map((r) => r.depth);
    const lat = rs.reduce((s, r) => s + r.lat, 0) / rs.length;
    return { lat, depthTop: Math.min(...depths), depthBottom: Math.max(...depths), points: rs };
  };
  const blue = goalBand('blue');
  const red = goalBand('red');
  const ptsLine = (band: { points: { lat: number; depth: number }[] }) =>
    `[${band.points.map((p) => `[${fmt(p.lat)}, ${fmt(p.depth)}]`).join(', ')}]`;

  const snippet = `// project/front/src/game/realgk/field.ts → metrics()
topY: height * ${fmt(topY)},
bottomY: height * ${fmt(bottomY)},
topLeft: width * ${fmt(corners.tl.x)},
topRight: width * ${fmt(corners.tr.x)},
bottomLeft: width * ${fmt(corners.bl.x)},
bottomRight: width * ${fmt(corners.br.x)},

// project/front/src/game/realgk/field.ts → GOALS (band derived from traced points)
[Team.Blue]: { lat: ${fmt(blue.lat)}, depthTop: ${fmt(blue.depthTop)}, depthBottom: ${fmt(blue.depthBottom)} },
[Team.Red]:  { lat: ${fmt(red.lat)}, depthTop: ${fmt(red.depthTop)}, depthBottom: ${fmt(red.depthBottom)} },

// traced goal points [lat, depth] (${blue.points.length} blue, ${red.points.length} red)
// blue: ${ptsLine(blue)}
// red:  ${ptsLine(red)}`;

  const modeBtn = (m: Mode, label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === m ? 'bg-sky-500 text-black' : 'bg-slate-700'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-[1280px] p-6 text-slate-100">
      <h1 className="text-xl font-semibold">Field calibrator</h1>
      <p className="mt-1 text-sm text-slate-400">
        <b>Handles</b>: drag the trapezoid corners. <b>Goal</b>: click to add points to the active goal, drag
        to adjust — trace the drawn mouth with as many points as you want. <b>Pen</b>: freehand sketch. Values
        on the right paste into <code>metrics()</code> and <code>GOALS</code>.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {modeBtn('handles', '◇ Handles')}
        {modeBtn('goal', '⚽ Goal points')}
        {modeBtn('pen', '✏️ Pen')}

        {mode === 'goal' && (
          <>
            <span className="ml-2 text-xs text-slate-500">Active goal:</span>
            <button
              onClick={() => setActiveGoal('blue')}
              className={`rounded-md px-3 py-1.5 text-sm ${activeGoal === 'blue' ? 'bg-blue-500 text-black' : 'bg-slate-700'}`}
            >
              Blue (left)
            </button>
            <button
              onClick={() => setActiveGoal('red')}
              className={`rounded-md px-3 py-1.5 text-sm ${activeGoal === 'red' ? 'bg-rose-500 text-black' : 'bg-slate-700'}`}
            >
              Red (right)
            </button>
            <button onClick={undoPoint} className="rounded-md bg-slate-700 px-3 py-1.5 text-sm">
              Undo point
            </button>
            <button onClick={clearGoal} className="rounded-md bg-slate-700 px-3 py-1.5 text-sm">
              Clear goal
            </button>
          </>
        )}
        {mode === 'pen' && (
          <button onClick={() => setStrokes([])} className="rounded-md bg-slate-700 px-3 py-1.5 text-sm">
            Clear pen
          </button>
        )}
        <button onClick={resetAll} className="rounded-md bg-slate-700 px-3 py-1.5 text-sm">
          Reset all
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          className="w-full rounded-lg border border-slate-700"
          style={{ touchAction: 'none', cursor: mode === 'handles' ? 'pointer' : 'crosshair' }}
        />

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">field.ts values</h2>
            <button
              onClick={() => navigator.clipboard?.writeText(snippet)}
              className="rounded-md bg-sky-600 px-2.5 py-1 text-xs font-medium"
            >
              Copy
            </button>
          </div>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-emerald-300">
            {snippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
