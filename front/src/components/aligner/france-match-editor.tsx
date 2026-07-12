'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DIVE_LENGTH } from '@/game/realgk/constants';
import { dive2HeightRatio, drawComposedHead, drawTrimmedSprite, gkHead, spriteHeightForBase } from '@/game/realgk/composite';
import { BodyAnim, HeadView } from '@/game/realgk/enums';
import type { FrameCfg } from '@/game/realgk/assets/configs';
import {
  baselineList,
  cfgIndexFor,
  exportSource,
  headSrcFor,
  liveList,
  PERSONA_INDICES,
  resetAllLive,
  resetLive,
  type EditorAnim,
  type NumericCfgKey,
} from './personas-match-editor-data';
import {
  applyFieldToFranceCharacter,
  applyLiveToAllLocked,
  clearFranceOverrides,
  FRANCE_ANIMS,
  FRANCE_HEAD_SCALE,
  loadFranceOverrides,
  patchLiveLocked,
  restoreLive,
  saveFranceOverrides,
  snapshotLive,
} from './france-match-editor-data';
import { SliderRow } from './slider-row';

/** Base drawn height (world units) — compositing is scale-invariant, so placement matches the pitch 1:1. */
const PREVIEW_BASE = 190;
const GRID_STEP = 20;
const HISTORY_MAX = 120;
/** Pauses longer than this start a new undo step (slider scrubs / head drags group into one). */
const GESTURE_MS = 500;

// Free-canvas board: every anim is a cell (ORIGINAL | EDITED pair), laid out in a grid you pan/zoom.
const COLS = 6;
const CELL_W = 640;
const CELL_H = 360;
const GAP = 28;
const STRIDE_X = CELL_W + GAP;
const STRIDE_Y = CELL_H + GAP;

type HeadImgs = { front: HTMLImageElement; back: HTMLImageElement; side: HTMLImageElement };
type HeadHit = { x: number; y: number; w: number; h: number; bw: number; bh: number; animIdx: number; frame: number; mirror: boolean };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** The match composites with headScale·personaHeadScale (render.ts scalePersonaHead) — mirror it here. */
const withHeadScale = (cfg: FrameCfg): FrameCfg => ({ ...cfg, headScale: cfg.headScale * FRANCE_HEAD_SCALE });

const cellX = (i: number): number => (i % COLS) * STRIDE_X;
const cellY = (i: number): number => Math.floor(i / COLS) * STRIDE_Y;

function headFor(cfg: FrameCfg, heads: HeadImgs): HTMLImageElement {
  const key = gkHead(cfg.headView);
  return key === 'back' ? heads.back : key === 'side' ? heads.side : heads.front;
}

export function FranceMatchEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [animIdx, setAnimIdx] = useState(0);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [persona, setPersona] = useState(0);
  const [grid, setGrid] = useState(true);
  // Body-size lock: head edits counter-adjust sizeScale so the drawn body height NEVER moves.
  const [lockBody, setLockBody] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [restored, setRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // Bumped after every live mutation so slider values re-read the mutated configs.
  const [rev, setRev] = useState(0);

  const anim = FRANCE_ANIMS[animIdx];
  const frameCount = anim.framePaths.length;
  const cfgIdx = cfgIndexFor(anim, frame);
  const cfg = liveList(anim)[cfgIdx];
  const baseCfg = baselineList(anim)[Math.min(cfgIdx, baselineList(anim).length - 1)];
  void rev;

  // Live refs the rAF loop reads without re-subscribing.
  const state = useRef({ animIdx, frame, playing, facing, grid });
  state.current = { animIdx, frame, playing, facing, grid };
  const lockRef = useRef(lockBody);
  lockRef.current = lockBody;

  const cam = useRef({ x: -GAP, y: -GAP, z: 0.5 });
  const bodies = useRef<Map<string, HTMLImageElement>>(new Map());
  const heads = useRef<HeadImgs | null>(null);
  const hits = useRef<HeadHit[]>([]);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; hit: HeadHit } | null>(null);
  const pan = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);

  // ---- undo/redo (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) — snapshots of the live maps, gesture-grouped ----
  const history = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const lastSig = useRef('');
  const lastAt = useRef(0);

  const mark = useCallback((sig: string) => {
    const now = Date.now();
    if (sig !== lastSig.current || now - lastAt.current > GESTURE_MS) {
      history.current.push(snapshotLive());
      if (history.current.length > HISTORY_MAX) history.current.shift();
      future.current = [];
    }
    lastSig.current = sig;
    lastAt.current = now;
  }, []);

  const persist = useCallback(() => {
    saveFranceOverrides();
    setSavedAt(new Date().toLocaleTimeString());
    setRev((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    const snap = history.current.pop();
    if (!snap) return;
    future.current.push(snapshotLive());
    restoreLive(snap);
    lastSig.current = '';
    persist();
  }, [persist]);

  const redo = useCallback(() => {
    const snap = future.current.pop();
    if (!snap) return;
    history.current.push(snapshotLive());
    restoreLive(snap);
    lastSig.current = '';
    persist();
  }, [persist]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (k === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ---- camera helpers ----
  const fitAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rows = Math.ceil(FRANCE_ANIMS.length / COLS);
    const w = Math.min(COLS, FRANCE_ANIMS.length) * STRIDE_X - GAP;
    const h = rows * STRIDE_Y - GAP;
    const z = clamp(Math.min(canvas.clientWidth / (w + GAP * 2), canvas.clientHeight / (h + GAP * 2)), 0.1, 1.5);
    cam.current = { x: (w - canvas.clientWidth / z) / 2, y: (h - canvas.clientHeight / z) / 2, z };
  }, []);

  const goTo = useCallback((i: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const z = Math.max(cam.current.z, 0.8);
    cam.current = { x: cellX(i) + CELL_W / 2 - canvas.clientWidth / z / 2, y: cellY(i) + CELL_H / 2 - canvas.clientHeight / z / 2, z };
  }, []);

  // ---- session restore + preview assets + initial fit ----
  useEffect(() => {
    setRestored(loadFranceOverrides());
    setRev((v) => v + 1);
    const map = bodies.current;
    for (const p of new Set(FRANCE_ANIMS.flatMap((a) => a.framePaths))) {
      const img = new Image();
      img.src = p;
      map.set(p, img);
    }
    fitAll();
  }, [fitAll]);

  useEffect(() => {
    const src = headSrcFor(persona);
    const mk = (s: string) => {
      const i = new Image();
      i.src = s;
      return i;
    };
    heads.current = { front: mk(src.front), back: mk(src.back), side: mk(src.side) };
  }, [persona]);

  // Wheel zoom to cursor (non-passive so we can eat the page scroll).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const c = cam.current;
      const z = clamp(c.z * Math.exp(-e.deltaY * 0.0012), 0.08, 4);
      // Keep the world point under the cursor fixed while zooming.
      cam.current = { x: c.x + mx / c.z - mx / z, y: c.y + my / c.z - my / z, z };
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // ---- the board: every anim cell drawn each frame (ORIGINAL | EDITED), grid under everything ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;

    const frameOf = (a: EditorAnim, now: number): number => {
      const s = state.current;
      if (!s.playing) return Math.min(s.frame, a.framePaths.length - 1);
      return Math.floor((now / 1000) * (a.fps || 6)) % a.framePaths.length;
    };

    const drawBoneco = (a: EditorAnim, list: FrameCfg[], fr: number, footX: number, footY: number, edited: boolean, ai: number): void => {
      const body = bodies.current.get(a.framePaths[fr]);
      const headSet = heads.current;
      const rawSizeCfg = list[0];
      const rawHeadCfg = list[Math.min(fr, list.length - 1)];
      if (!body?.complete || !body.naturalWidth || !headSet || !rawSizeCfg || !rawHeadCfg) return;
      const sizeCfg = withHeadScale(rawSizeCfg);
      const headCfg = withHeadScale(rawHeadCfg);
      const mirror = a.sideMode ? state.current.facing < 0 : false;
      const fullFrame = [0, 0, body.naturalWidth, body.naturalHeight];
      // Same sizing as the France match renderer: whole pre-trimmed frames; dives normalize by the
      // frame's own dims; dive v2 keeps its approved per-frame height ratios.
      const spriteH = a.dive
        ? (PREVIEW_BASE * DIVE_LENGTH) / Math.max(1, body.naturalWidth / Math.max(1, body.naturalHeight))
        : a.id === BodyAnim.GkDiveV2
          ? spriteHeightForBase(PREVIEW_BASE, sizeCfg, true) * dive2HeightRatio(fr, body, bodies.current.get(a.framePaths[0]))
          : spriteHeightForBase(PREVIEW_BASE, sizeCfg, true);
      const rect = drawTrimmedSprite(ctx, body, fullFrame, footX, footY, spriteH, mirror);
      if (!rect) return;
      const hImg = headFor(headCfg, headSet);
      drawComposedHead(ctx, hImg, footX, rect, mirror, headCfg);
      if (edited) {
        const hh = rect.drawH * headCfg.headScale;
        const hw = hImg.naturalWidth * (hh / Math.max(1, hImg.naturalHeight));
        const hx = footX - hw * 0.5 + rect.drawW * headCfg.offsetXRatio * (mirror ? -1 : 1);
        const hy = rect.drawY - hh + rect.drawH * headCfg.offsetYRatio;
        hits.current.push({ x: hx, y: hy, w: hw, h: hh, bw: rect.drawW, bh: rect.drawH, animIdx: ai, frame: fr, mirror });
      }
    };

    const loop = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pw = Math.round(canvas.clientWidth * dpr);
      const ph = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const { x: cx, y: cy, z } = cam.current;
      hits.current = [];

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#07131a';
      ctx.fillRect(0, 0, W, H);
      ctx.setTransform(dpr * z, 0, 0, dpr * z, -dpr * cx * z, -dpr * cy * z);

      const wx0 = cx;
      const wy0 = cy;
      const wx1 = cx + W / z;
      const wy1 = cy + H / z;

      if (state.current.grid) {
        // Adaptive world grid: densify/sparsify with zoom so lines stay ~legible.
        let step = GRID_STEP;
        while (step * z < 12) step *= 2;
        ctx.lineWidth = 1 / z;
        ctx.strokeStyle = 'rgba(148, 233, 255, 0.07)';
        for (let x = Math.floor(wx0 / step) * step; x <= wx1; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, wy0);
          ctx.lineTo(x, wy1);
          ctx.stroke();
        }
        for (let y = Math.floor(wy0 / step) * step; y <= wy1; y += step) {
          ctx.beginPath();
          ctx.moveTo(wx0, y);
          ctx.lineTo(wx1, y);
          ctx.stroke();
        }
      }

      for (let i = 0; i < FRANCE_ANIMS.length; i++) {
        const x = cellX(i);
        const y = cellY(i);
        if (x > wx1 || y > wy1 || x + CELL_W < wx0 || y + CELL_H < wy0) continue; // cull off-screen cells
        const a = FRANCE_ANIMS[i];
        const selected = i === state.current.animIdx;
        const fr = frameOf(a, now);

        ctx.lineWidth = (selected ? 2.5 : 1) / z;
        ctx.strokeStyle = selected ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.14)';
        ctx.strokeRect(x, y, CELL_W, CELL_H);

        const footY = y + CELL_H - 48;
        ctx.lineWidth = 1 / z;
        ctx.strokeStyle = 'rgba(124,239,193,0.35)';
        ctx.beginPath();
        ctx.moveTo(x + 16, footY);
        ctx.lineTo(x + CELL_W - 16, footY);
        ctx.stroke();
        // Center divider so the ORIGINAL | EDITED halves read at a glance.
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(x + CELL_W / 2, y + 34);
        ctx.lineTo(x + CELL_W / 2, y + CELL_H - 12);
        ctx.stroke();
        if (selected) {
          ctx.strokeStyle = 'rgba(243,214,111,0.4)';
          ctx.setLineDash([4 / z, 4 / z]);
          ctx.strokeRect(x + CELL_W * 0.73 - PREVIEW_BASE * 0.22, footY - PREVIEW_BASE, PREVIEW_BASE * 0.44, PREVIEW_BASE);
          ctx.setLineDash([]);
        }

        ctx.fillStyle = selected ? 'rgba(52,211,153,0.95)' : 'rgba(255,255,255,0.75)';
        ctx.font = `bold ${15}px monospace`;
        ctx.fillText(`${a.label}  ·  f${fr + 1}/${a.framePaths.length}`, x + 12, y + 22);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = `${12}px monospace`;
        ctx.fillText('original', x + 12, y + CELL_H - 14);
        ctx.fillText('edited', x + CELL_W / 2 + 12, y + CELL_H - 14);

        drawBoneco(a, baselineList(a), fr, x + CELL_W * 0.27, footY, false, i);
        drawBoneco(a, liveList(a), fr, x + CELL_W * 0.73, footY, true, i);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---- pointer: head drag (on any EDITED boneco) or board pan ----
  const toWorld = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    const { x, y, z } = cam.current;
    return { wx: x + (e.clientX - r.left) / z, wy: y + (e.clientY - r.top) / z };
  };

  const onDown = (e: React.PointerEvent) => {
    const { wx, wy } = toWorld(e);
    const hit = [...hits.current].reverse().find((h) => wx >= h.x && wx <= h.x + h.w && wy >= h.y && wy <= h.y + h.h);
    (e.target as Element).setPointerCapture(e.pointerId);
    if (hit) {
      // Grabbing a head selects its anim, freezes playback on that frame, and starts the offset drag.
      setAnimIdx(hit.animIdx);
      setFrame(hit.frame);
      setPlaying(false);
      const a = FRANCE_ANIMS[hit.animIdx];
      const c = liveList(a)[cfgIndexFor(a, hit.frame)];
      if (!c) return;
      drag.current = { sx: wx, sy: wy, ox: c.offsetXRatio, oy: c.offsetYRatio, hit };
    } else {
      // Clicking a cell opens that anim for editing right away (pan still works from anywhere).
      const col = Math.floor(wx / STRIDE_X);
      const row = Math.floor(wy / STRIDE_Y);
      const i = row * COLS + col;
      if (col >= 0 && col < COLS && row >= 0 && i < FRANCE_ANIMS.length && wx - col * STRIDE_X <= CELL_W && wy - row * STRIDE_Y <= CELL_H) {
        setAnimIdx(i);
        setFrame(0);
      }
      pan.current = { sx: e.clientX, sy: e.clientY, cx: cam.current.x, cy: cam.current.y };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      const { wx, wy } = toWorld(e);
      const a = FRANCE_ANIMS[d.hit.animIdx];
      mark(`drag:${d.hit.animIdx}:${d.hit.frame}`);
      patchLiveLocked(
        a,
        d.hit.frame,
        {
          offsetXRatio: clamp(d.ox + (wx - d.sx) / (d.hit.bw * (d.hit.mirror ? -1 : 1)), -0.6, 0.6),
          offsetYRatio: clamp(d.oy + (wy - d.sy) / d.hit.bh, -0.2, 0.8),
        },
        lockRef.current,
      );
      persist();
      return;
    }
    const p = pan.current;
    if (p) {
      const z = cam.current.z;
      cam.current = { x: p.cx - (e.clientX - p.sx) / z, y: p.cy - (e.clientY - p.sy) / z, z };
    }
  };
  const onUp = () => {
    drag.current = null;
    pan.current = null;
  };

  // ---- live mutation (undoable + auto-saved) ----
  function patch(part: Partial<FrameCfg>, sig: string): void {
    mark(sig);
    patchLiveLocked(anim, frame, part, lockRef.current);
    persist();
  }

  const fieldValue = (k: NumericCfgKey): number => (cfg?.[k] as number | undefined) ?? (k === 'sizeScale' ? 1 : 0);
  const baseValue = (k: NumericCfgKey): number => (baseCfg?.[k] as number | undefined) ?? (k === 'sizeScale' ? 1 : 0);
  const row = (label: string, k: NumericCfgKey, min: number, max: number, step: number) => (
    <SliderRow
      label={label}
      value={fieldValue(k)}
      changed={Math.abs(fieldValue(k) - baseValue(k)) > 1e-4}
      min={min}
      max={max}
      step={step}
      onCommit={(v) => patch({ [k]: v } as Partial<FrameCfg>, `slider:${animIdx}:${cfgIdx}:${k}`)}
      onAll={() => {
        mark(`all:${animIdx}:${k}`);
        applyFieldToFranceCharacter(anim, k, fieldValue(k), lockRef.current);
        persist();
      }}
    />
  );

  return (
    <div className="flex h-screen w-full select-none bg-[#06222f] text-white">
      {/* Free board: pan (drag), zoom (wheel), grab any EDITED head to place it. */}
      <div className="relative flex-1 overflow-hidden" data-lenis-prevent>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
          style={{ imageRendering: 'pixelated' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        <div className="pointer-events-none absolute left-3 top-3 rounded border border-white/15 bg-black/60 px-2.5 py-1 font-mono text-[11px] text-white/70">
          drag = pan · wheel = zoom · grab an <span className="text-emerald-300">edited</span> head to place it (selects the anim)
        </div>
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <button onClick={fitAll} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">fit all</button>
          <button onClick={() => goTo(animIdx)} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">go to selected</button>
        </div>
      </div>

      {/* Editor rail — mutates the SAME config objects the match renderer reads. */}
      <aside className="w-[340px] shrink-0 space-y-3 overflow-y-auto border-l border-white/10 bg-black/40 p-3 text-[12px]" data-lenis-prevent>
        <div className="font-bold uppercase tracking-wide text-emerald-300">France editor — free board</div>
        <div className="flex items-center gap-2 text-[10px] text-white/50">
          <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-emerald-300">auto-save ✓{savedAt ? ` ${savedAt}` : ''}</span>
          <span>Ctrl+Z undo · Ctrl+Shift+Z / Ctrl+Y redo</span>
        </div>
        {restored && (
          <div className="rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">
            Session overrides restored (editor-only). “Reset all” discards them.
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={undo} className="flex-1 rounded bg-slate-700 px-2 py-1 hover:bg-slate-600">↶ Undo</button>
          <button onClick={redo} className="flex-1 rounded bg-slate-700 px-2 py-1 hover:bg-slate-600">↷ Redo</button>
        </div>

        <div>
          <div className="mb-1 text-white/60">Anim (click a cell or pick here)</div>
          <select
            value={animIdx}
            onChange={(e) => {
              const i = Number(e.target.value);
              setAnimIdx(i);
              setFrame(0);
              goTo(i);
            }}
            className="w-full rounded bg-slate-800 px-2 py-1"
          >
            {FRANCE_ANIMS.map((a, i) => (
              <option key={a.id} value={i}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="rounded bg-slate-700 px-3 py-1">{playing ? '❚❚' : '▶'}</button>
          <button onClick={() => { setPlaying(false); setFrame((f) => (f - 1 + frameCount) % frameCount); }} className="rounded bg-slate-700 px-2 py-1">‹</button>
          <button onClick={() => { setPlaying(false); setFrame((f) => (f + 1) % frameCount); }} className="rounded bg-slate-700 px-2 py-1">›</button>
          <span className="ml-auto font-mono text-white/60">
            {playing ? 'all playing' : `frame ${frame + 1}/${frameCount}`}
            {!playing && liveList(anim).length < frameCount ? ` · cfg ${cfgIdx + 1}/${liveList(anim).length}` : ''}
          </span>
        </div>
        <div className="text-[10px] text-white/40">pause freezes EVERY cell on the selected frame (clamped per anim) — edits always target the frame shown here</div>

        {anim.sideMode && (
          <div className="flex items-center gap-2">
            <span className="text-white/60">Facing</span>
            <button onClick={() => setFacing(-1)} className={`rounded px-2 py-1 ${facing < 0 ? 'bg-emerald-500 text-black' : 'bg-slate-700'}`}>← Left</button>
            <button onClick={() => setFacing(1)} className={`rounded px-2 py-1 ${facing > 0 ? 'bg-emerald-500 text-black' : 'bg-slate-700'}`}>Right →</button>
          </div>
        )}

        <div>
          <div className="mb-1 text-white/60">Persona head (preview)</div>
          <select value={persona} onChange={(e) => setPersona(Number(e.target.value))} className="w-full rounded bg-slate-800 px-2 py-1">
            {PERSONA_INDICES.map((i) => (
              <option key={i} value={i}>p{String(i + 1).padStart(2, '0')}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-1.5 text-[11px]">
            <input type="checkbox" checked={lockBody} onChange={(e) => setLockBody(e.target.checked)} />
            <span>
              <span className="font-bold text-emerald-300">Lock body size</span>
              <span className="text-white/60"> — head edits never resize the body</span>
            </span>
          </label>
          <label className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-[11px]">
            <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} />
            <span className="text-white/60">Grid lines (adaptive, {GRID_STEP}u base)</span>
          </label>
        </div>

        {cfg && (
          <div className="space-y-1.5 border-t border-white/10 pt-2">
            <div className="mb-1 font-bold uppercase text-emerald-300">Head — {anim.label} · frame {cfgIdx + 1}</div>
            <label className="flex items-center gap-2 text-[11px]">
              <span className="w-20 text-white/60">view</span>
              <select value={cfg.headView} onChange={(e) => patch({ headView: e.target.value as HeadView }, `view:${animIdx}:${cfgIdx}:${e.target.value}`)} className="flex-1 rounded bg-slate-800 px-1 py-0.5">
                <option value={HeadView.Front}>Front</option>
                <option value={HeadView.Back}>Back</option>
                <option value={HeadView.Side}>Side</option>
              </select>
            </label>
            {row('headScale', 'headScale', 0.1, 0.9, 0.005)}
            {row('offsetX', 'offsetXRatio', -0.4, 0.5, 0.002)}
            {row('offsetY', 'offsetYRatio', -0.15, 0.6, 0.002)}
            {row('sizeScale', 'sizeScale', 0.4, 1.4, 0.01)}
            <div className="text-[10px] text-white/40">amber • = differs from source · type a value + Enter (free of slider bounds) · “all” = every anim of this character ({anim.map === 'keeper' ? 'keeper set' : 'outfield boneco'})</div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-2">
          <button onClick={() => { mark(`applyall:${animIdx}:${frame}:${Date.now()}`); applyLiveToAllLocked(anim, frame, lockRef.current); persist(); }} className="rounded bg-sky-600 px-2 py-1 text-black">Apply → all frames</button>
          <button onClick={() => { mark(`reset:${animIdx}:${Date.now()}`); resetLive(anim); persist(); }} className="rounded bg-slate-700 px-2 py-1">Reset anim</button>
          <button onClick={() => { mark(`resetall:${Date.now()}`); resetAllLive(); clearFranceOverrides(); setRestored(false); setRev((v) => v + 1); }} className="rounded bg-red-900/80 px-2 py-1">Reset all</button>
        </div>

        <div className="border-t border-white/10 pt-2">
          <button onClick={() => setShowExport((v) => !v)} className="w-full rounded bg-emerald-500 px-2 py-1 font-bold text-black">{showExport ? 'Hide export' : 'Export configs'}</button>
          {showExport && (
            <>
              <button onClick={() => navigator.clipboard.writeText(exportSource())} className="mt-2 w-full rounded bg-slate-700 px-2 py-1">Copy to clipboard</button>
              <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-950 p-2 text-[9.5px] leading-tight text-emerald-200">{exportSource()}</pre>
              <div className="mt-1 text-[10px] text-white/40">Paste over the three maps in src/game/realgk/assets/configs.ts to make it permanent.</div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
