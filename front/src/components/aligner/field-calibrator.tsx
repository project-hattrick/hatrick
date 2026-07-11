'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildSnippet,
  clearCalibratorState,
  loadCalibratorState,
  pointFor,
  ratioFor,
  saveCalibratorState,
  COMMENT_COLOR,
  CORNER_HANDLES,
  defaultCalibratorState,
  GOAL_COLOR,
  type CalibratorState,
  type CommentPin,
  type CornerKey,
  type GoalSide,
  type Pt,
} from './field-calibrator-data';

/** Court image the engine paints each frame (see realgk/render.ts COURT_BG). */
const COURT_SRC = '/game/stadiums/rain-court/court.png';
/** Internal canvas resolution; the image is letterboxed inside preserving aspect. */
const CANVAS_W = 1180;
const CANVAS_H = 760;
/** Hit radius in SCREEN px (divided by zoom for base-space tests, so grabbing feels constant). */
const HIT_R = 14;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

type Mode = 'handles' | 'lines' | 'goal' | 'comment' | 'pen';
type LineEdge = 'left' | 'right' | 'top' | 'bottom';

type Drag =
  | { type: 'corner'; key: CornerKey }
  | { type: 'goal'; side: GoalSide; index: number }
  | { type: 'line'; edge: LineEdge }
  | { type: 'center' }
  | { type: 'comment'; id: number }
  | { type: 'pan'; startX: number; startY: number; viewX: number; viewY: number }
  | null;

interface Fit {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Canva-style viewport: scale + offset applied on top of the base canvas space. */
interface View {
  zoom: number;
  x: number;
  y: number;
}

const isEditable = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

/** Dev tool: trace the court trapezoid, out lines, center, goals; zoom/pan like a canvas app; pin notes.
 *  `courtSrc`/`storageKey`/`initial` map another stadium (e.g. ?court=franca) without touching the
 *  rain-court trace — `initial` seeds (and "Reset all" restores) that court's current in-game mapping. */
export function FieldCalibrator({ courtSrc = COURT_SRC, storageKey, initial }: { courtSrc?: string; storageKey?: string; initial?: CalibratorState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fitRef = useRef<Fit>({ x: 0, y: 0, w: CANVAS_W, h: CANVAS_H });

  const base = initial ?? defaultCalibratorState();
  const [corners, setCorners] = useState(base.corners);
  const [goals, setGoals] = useState<Record<GoalSide, Pt[]>>(base.goals);
  const [playLines, setPlayLines] = useState(base.playLines);
  const [center, setCenter] = useState(base.center);
  const [comments, setComments] = useState<CommentPin[]>([]);
  const [selectedComment, setSelectedComment] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('handles');
  const [activeGoal, setActiveGoal] = useState<GoalSide>('blue');
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);

  const drag = useRef<Drag>(null);
  const penning = useRef(false);
  const nextCommentId = useRef(1);

  // Restore the persisted session (runs before the save effect below, so nothing is clobbered).
  // localStorage is only readable on the client, so a lazy useState initializer would break SSR
  // hydration — the one-shot post-mount setState is intentional here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadCalibratorState(storageKey);
    if (!saved) return;
    setCorners(saved.corners);
    setGoals(saved.goals);
    setPlayLines(saved.playLines);
    setCenter(saved.center);
    setComments(saved.comments);
    nextCommentId.current = saved.comments.reduce((m, c) => Math.max(m, c.id), 0) + 1;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist every mapping change (survives refresh — this is a long mapping session tool).
  useEffect(() => {
    saveCalibratorState({ corners, goals, playLines, center, comments }, storageKey);
  }, [corners, goals, playLines, center, comments, storageKey]);

  // Space = hold to pan (ignored while typing a comment).
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isEditable(e.target)) return;
      setSpaceHeld(true);
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpaceHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Wheel zoom at the cursor (native listener — React's synthetic wheel is passive, preventDefault fails).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
      const cy = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
      setView((v) => {
        const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
        return { zoom, x: cx - ((cx - v.x) * zoom) / v.zoom, y: cy - ((cy - v.y) * zoom) / v.zoom };
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Load the court once, computing the letterbox fit (contain).
  useEffect(() => {
    const img = new Image();
    img.src = courtSrc;
    img.onload = () => {
      imgRef.current = img;
      const scale = Math.min(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      fitRef.current = { x: (CANVAS_W - w) / 2, y: (CANVAS_H - h) / 2, w, h };
      setLoaded(true);
    };
  }, [courtSrc]);

  const toCanvas = useCallback((r: Pt): Pt => {
    const f = fitRef.current;
    return { x: f.x + r.x * f.w, y: f.y + r.y * f.h };
  }, []);

  const toRatio = useCallback((cx: number, cy: number): Pt => {
    const f = fitRef.current;
    return { x: clamp01((cx - f.x) / f.w), y: clamp01((cy - f.y) / f.h) };
  }, []);

  /** Drag handles for the out-of-play lines (edge midpoints) + the center spot, in image ratios. */
  const lineHandles = (): { edge: LineEdge | 'center'; pt: Pt }[] => {
    const midDepth = (playLines.depthTop + playLines.depthBottom) / 2;
    const midLat = (playLines.latLeft + playLines.latRight) / 2;
    return [
      { edge: 'left', pt: pointFor(corners, playLines.latLeft, midDepth) },
      { edge: 'right', pt: pointFor(corners, playLines.latRight, midDepth) },
      { edge: 'top', pt: pointFor(corners, midLat, playLines.depthTop) },
      { edge: 'bottom', pt: pointFor(corners, midLat, playLines.depthBottom) },
      { edge: 'center', pt: pointFor(corners, center.lat, center.depth) },
    ];
  };

  // Redraw everything on any state change.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !imgRef.current) return;
    const f = fitRef.current;
    const z = view.zoom;
    const sw = (v: number) => v / z; // constant SCREEN size for handles/lines regardless of zoom

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.setTransform(z, 0, 0, z, view.x, view.y);
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
    ctx.lineWidth = sw(2);
    ctx.stroke();

    // Goal polylines + points.
    (['blue', 'red'] as GoalSide[]).forEach((side) => {
      const pts = goals[side];
      const isActive = mode === 'goal' && side === activeGoal;
      if (pts.length >= 2) {
        ctx.strokeStyle = GOAL_COLOR[side];
        ctx.lineWidth = sw(isActive ? 5 : 4);
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
        ctx.arc(c.x, c.y, sw(isActive ? 7 : 5), 0, Math.PI * 2);
        ctx.fillStyle = GOAL_COLOR[side];
        ctx.fill();
        ctx.strokeStyle = '#0b1020';
        ctx.lineWidth = sw(2);
        ctx.stroke();
      });
    });

    // Freehand pen strokes.
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = sw(2.5);
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

    // Out-of-play lines quad (yellow) + center spot — always visible, handles lit in Lines mode.
    const quad = [
      pointFor(corners, playLines.latLeft, playLines.depthTop),
      pointFor(corners, playLines.latRight, playLines.depthTop),
      pointFor(corners, playLines.latRight, playLines.depthBottom),
      pointFor(corners, playLines.latLeft, playLines.depthBottom),
    ].map(toCanvas);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = sw(mode === 'lines' ? 3 : 2);
    ctx.beginPath();
    quad.forEach((q, i) => (i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)));
    ctx.closePath();
    ctx.stroke();
    const cc = toCanvas(pointFor(corners, center.lat, center.depth));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = sw(2);
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, sw(9), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cc.x - sw(14), cc.y);
    ctx.lineTo(cc.x + sw(14), cc.y);
    ctx.moveTo(cc.x, cc.y - sw(14));
    ctx.lineTo(cc.x, cc.y + sw(14));
    ctx.stroke();
    ctx.globalAlpha = mode === 'lines' ? 1 : 0.35;
    for (const h of lineHandles()) {
      const c = toCanvas(h.pt);
      ctx.beginPath();
      ctx.arc(c.x, c.y, sw(7), 0, Math.PI * 2);
      ctx.fillStyle = h.edge === 'center' ? '#ffffff' : '#fde047';
      ctx.fill();
      ctx.strokeStyle = '#0b1020';
      ctx.lineWidth = sw(2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Comment pins: numbered markers; the selected one shows its note in a bubble.
    comments.forEach((cm, i) => {
      const c = toCanvas(cm);
      const selected = cm.id === selectedComment;
      ctx.beginPath();
      ctx.arc(c.x, c.y, sw(selected ? 11 : 9), 0, Math.PI * 2);
      ctx.fillStyle = COMMENT_COLOR;
      ctx.fill();
      ctx.strokeStyle = selected ? '#ffffff' : '#0b1020';
      ctx.lineWidth = sw(2);
      ctx.stroke();
      ctx.fillStyle = '#0b1020';
      ctx.font = `700 ${sw(11)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), c.x, c.y + sw(0.5));
      if (selected && cm.text) {
        const label = cm.text.length > 46 ? `${cm.text.slice(0, 45)}…` : cm.text;
        ctx.font = `500 ${sw(12)}px system-ui, sans-serif`;
        const w = ctx.measureText(label).width + sw(16);
        const h = sw(24);
        const bx = c.x + sw(14);
        const by = c.y - h / 2;
        ctx.fillStyle = 'rgba(15,23,42,0.92)';
        ctx.strokeStyle = COMMENT_COLOR;
        ctx.lineWidth = sw(1.5);
        ctx.beginPath();
        ctx.roundRect(bx, by, w, h, sw(6));
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        ctx.fillText(label, bx + sw(8), c.y + sw(0.5));
      }
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    });

    // Corner handles (only meaningful in handles mode; dimmed otherwise).
    ctx.globalAlpha = mode === 'handles' ? 1 : 0.4;
    for (const h of CORNER_HANDLES) {
      const c = toCanvas(corners[h.key]);
      ctx.beginPath();
      ctx.arc(c.x, c.y, sw(7), 0, Math.PI * 2);
      ctx.fillStyle = h.color;
      ctx.fill();
      ctx.strokeStyle = '#0b1020';
      ctx.lineWidth = sw(2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lineHandles derives from corners/playLines/center below
  }, [corners, goals, strokes, loaded, mode, activeGoal, playLines, center, comments, selectedComment, view, toCanvas]);

  /** Pointer position in screen-canvas px (sx/sy), base px (bx/by, view-inverted) and image ratio. */
  const eventPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const sy = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    const bx = (sx - view.x) / view.zoom;
    const by = (sy - view.y) / view.zoom;
    return { sx, sy, bx, by, ratio: toRatio(bx, by) };
  };

  const hitR2 = () => (HIT_R / view.zoom) ** 2;

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { sx, sy, bx, by, ratio } = eventPoint(e);
    canvasRef.current?.setPointerCapture(e.pointerId);

    // Space-drag or middle button = pan, in any mode (Canva-style).
    if (spaceHeld || e.button === 1) {
      e.preventDefault();
      drag.current = { type: 'pan', startX: sx, startY: sy, viewX: view.x, viewY: view.y };
      return;
    }

    if (mode === 'pen') {
      penning.current = true;
      setStrokes((s) => [...s, [ratio]]);
      return;
    }

    if (mode === 'handles') {
      let best: CornerKey | null = null;
      let bestD = hitR2();
      for (const h of CORNER_HANDLES) {
        const c = toCanvas(corners[h.key]);
        const d = (c.x - bx) ** 2 + (c.y - by) ** 2;
        if (d < bestD) {
          bestD = d;
          best = h.key;
        }
      }
      drag.current = best ? { type: 'corner', key: best } : null;
      return;
    }

    if (mode === 'lines') {
      let best: LineEdge | 'center' | null = null;
      let bestD = hitR2();
      for (const h of lineHandles()) {
        const c = toCanvas(h.pt);
        const d = (c.x - bx) ** 2 + (c.y - by) ** 2;
        if (d < bestD) {
          bestD = d;
          best = h.edge;
        }
      }
      drag.current = best === null ? null : best === 'center' ? { type: 'center' } : { type: 'line', edge: best };
      return;
    }

    if (mode === 'comment') {
      let hitId: number | null = null;
      let bestD = hitR2();
      for (const cm of comments) {
        const c = toCanvas(cm);
        const d = (c.x - bx) ** 2 + (c.y - by) ** 2;
        if (d < bestD) {
          bestD = d;
          hitId = cm.id;
        }
      }
      if (hitId === null) {
        const pin: CommentPin = { id: nextCommentId.current++, x: ratio.x, y: ratio.y, text: '' };
        setComments((cs) => [...cs, pin]);
        hitId = pin.id;
      }
      setSelectedComment(hitId);
      drag.current = { type: 'comment', id: hitId };
      return;
    }

    // Goal mode: grab the nearest point of the active goal, else append a new one.
    const pts = goals[activeGoal];
    let hit = -1;
    let bestD = hitR2();
    pts.forEach((r, i) => {
      const c = toCanvas(r);
      const d = (c.x - bx) ** 2 + (c.y - by) ** 2;
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
    const { sx, sy, ratio } = eventPoint(e);
    if (penning.current) {
      setStrokes((s) => {
        const next = s.slice();
        next[next.length - 1] = [...next[next.length - 1], ratio];
        return next;
      });
      return;
    }
    const d = drag.current!;
    if (d.type === 'pan') {
      setView((v) => ({ zoom: v.zoom, x: d.viewX + (sx - d.startX), y: d.viewY + (sy - d.startY) }));
    } else if (d.type === 'corner') {
      setCorners((c) => ({ ...c, [d.key]: ratio }));
    } else if (d.type === 'line') {
      const r = ratioFor(corners, ratio);
      setPlayLines((pl) => {
        if (d.edge === 'left') return { ...pl, latLeft: Math.min(r.lat, pl.latRight - 0.02) };
        if (d.edge === 'right') return { ...pl, latRight: Math.max(r.lat, pl.latLeft + 0.02) };
        if (d.edge === 'top') return { ...pl, depthTop: Math.min(r.depth, pl.depthBottom - 0.02) };
        return { ...pl, depthBottom: Math.max(r.depth, pl.depthTop + 0.02) };
      });
    } else if (d.type === 'center') {
      const r = ratioFor(corners, ratio);
      setCenter({ lat: r.lat, depth: r.depth });
    } else if (d.type === 'comment') {
      setComments((cs) => cs.map((cm) => (cm.id === d.id ? { ...cm, x: ratio.x, y: ratio.y } : cm)));
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
  const setCommentText = (id: number, text: string) => setComments((cs) => cs.map((cm) => (cm.id === id ? { ...cm, text } : cm)));
  const deleteComment = (id: number) => {
    setComments((cs) => cs.filter((cm) => cm.id !== id));
    setSelectedComment((sel) => (sel === id ? null : sel));
  };
  const resetAll = () => {
    setCorners(base.corners);
    setGoals(base.goals);
    setPlayLines(base.playLines);
    setCenter(base.center);
    setComments([]);
    setSelectedComment(null);
    clearCalibratorState(storageKey);
  };

  const snippet = buildSnippet({ corners, goals, playLines, center, comments });

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
        <b>Scroll</b> zooms at the cursor; <b>Space+drag</b> (or middle button) pans. <b>Handles</b>: trapezoid
        corners. <b>Out lines + center</b>: yellow edges = where the ball is out, white crosshair = kickoff
        center. <b>Goal</b>: trace the mouth. <b>Comment</b>: click anywhere to pin a numbered note (drag to
        move, edit on the right). <b>Pen</b>: freehand. Everything persists locally; Copy exports
        <code> metrics()</code>, <code>GOALS</code>, <code>CENTER</code>, <code>PLAY_LINES</code> + notes.
        Verify in-game at <code>/sandbox?cp=real-gk-solo</code>.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {modeBtn('handles', '◇ Handles')}
        {modeBtn('lines', '▢ Out lines + center')}
        {modeBtn('goal', '⚽ Goal points')}
        {modeBtn('comment', '📍 Comment')}
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

        <span className="ml-auto text-xs tabular-nums text-slate-400">{Math.round(view.zoom * 100)}%</span>
        <button onClick={() => setView({ zoom: 1, x: 0, y: 0 })} className="rounded-md bg-slate-700 px-3 py-1.5 text-sm">
          Reset view
        </button>
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
          style={{
            touchAction: 'none',
            cursor: spaceHeld ? 'grab' : mode === 'handles' || mode === 'lines' ? 'pointer' : 'crosshair',
          }}
        />

        <div className="space-y-4">
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
            <pre className="mt-2 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-emerald-300">
              {snippet}
            </pre>
          </div>

          {(comments.length > 0 || mode === 'comment') && (
            <div>
              <h2 className="text-sm font-semibold text-slate-300">Comments ({comments.length})</h2>
              <div className="mt-2 max-h-[300px] space-y-2 overflow-auto pr-1">
                {comments.map((cm, i) => (
                  <div
                    key={cm.id}
                    className={`rounded-lg border p-2 ${cm.id === selectedComment ? 'border-orange-500 bg-slate-900' : 'border-slate-700 bg-slate-900/60'}`}
                    onClick={() => setSelectedComment(cm.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400">📍 {i + 1}</span>
                      <button onClick={() => deleteComment(cm.id)} className="text-xs text-slate-500 hover:text-rose-400">
                        delete
                      </button>
                    </div>
                    <textarea
                      value={cm.text}
                      onChange={(e) => setCommentText(cm.id, e.target.value)}
                      onFocus={() => setSelectedComment(cm.id)}
                      placeholder="Note for this spot…"
                      rows={2}
                      className="mt-1 w-full resize-y rounded-md bg-slate-800 p-2 text-xs text-slate-100 outline-none placeholder:text-slate-500"
                    />
                  </div>
                ))}
                {comments.length === 0 && <p className="text-xs text-slate-500">Click the court to pin a note.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
