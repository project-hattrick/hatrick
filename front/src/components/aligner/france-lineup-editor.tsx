'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FrameCfg } from '@/game/realgk/assets/configs';
import { composedHeadHeight, dive2HeightRatio, drawComposedHead, drawTrimmedSprite, gkHead, spriteHeightForBase } from '@/game/realgk/composite';
import { FRANCE_COMPLETE_SIZE_VARIANTS } from '@/game/realgk/config';
import { DIVE_LENGTH } from '@/game/realgk/constants';
import { BodyAnim, HeadView } from '@/game/realgk/enums';
import { clamp, lerp } from '@/game/realgk/util';
import {
  baselineList,
  cfgIndexFor,
  exportSource,
  headSrcFor,
  liveList,
  PERSONA_INDICES,
  resetLive,
  type EditorAnim,
  type NumericCfgKey,
} from './personas-match-editor-data';
import {
  applyFieldToFranceCharacter,
  applyLiveToAllLocked,
  FRANCE_ANIMS,
  FRANCE_HEAD_SCALE,
  loadFranceOverrides,
  patchLiveLocked,
  restoreLive,
  saveFranceOverrides,
  snapshotLive,
} from './france-match-editor-data';
import { SliderRow } from './slider-row';

/**
 * Single-row lineup of EVERY France anim, side by side, rendered with the exact math + numbers of the
 * "Bigger" size variant of the france-complete arena (sprite range, personaHeadScale, headMaxFraction
 * cap). World units ARE game screen pixels at camera zoom 1, so "1:1" shows the true in-match size.
 * Edits share the France free-board editor's live configs and storage — tweaks here land there too.
 */
const CFG = FRANCE_COMPLETE_SIZE_VARIANTS.a.config;

const GROUND_Y = 300;
/** Horizontal poses need a wider slot so the row never overlaps. */
const WIDE_ANIMS = new Set<BodyAnim>([BodyAnim.GkDive, BodyAnim.GkDiveCompact, BodyAnim.GkDiveV2, BodyAnim.SlideTackle, BodyAnim.KneeSlide]);
const SLOT_W = 70;
const WIDE_SLOT_W = 130;
const HISTORY_MAX = 120;
const GESTURE_MS = 500;

const slotWidth = (a: EditorAnim): number => (WIDE_ANIMS.has(a.id) ? WIDE_SLOT_W : SLOT_W);
const ROW_W = FRANCE_ANIMS.reduce((w, a) => w + slotWidth(a), 0);

type HeadImgs = { front: HTMLImageElement; back: HTMLImageElement; side: HTMLImageElement };
type HeadHit = { x: number; y: number; w: number; h: number; bw: number; bh: number; animIdx: number; frame: number; mirror: boolean };
type Slot = { x: number; w: number };

const SLOTS: Slot[] = (() => {
  let x = 0;
  return FRANCE_ANIMS.map((a) => {
    const s = { x, w: slotWidth(a) };
    x += s.w;
    return s;
  });
})();

/** The match composites with headScale·personaHeadScale (render.ts scalePersonaHead) — mirror it here. */
const withHeadScale = (cfg: FrameCfg): FrameCfg => ({ ...cfg, headScale: cfg.headScale * FRANCE_HEAD_SCALE });

function headFor(cfg: FrameCfg, heads: HeadImgs): HTMLImageElement {
  const key = gkHead(cfg.headView);
  return key === 'back' ? heads.back : key === 'side' ? heads.side : heads.front;
}

export function FranceLineupEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [animIdx, setAnimIdx] = useState(0);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [persona, setPersona] = useState(0);
  const [depth, setDepth] = useState(0.75);
  const [lockBody, setLockBody] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [restored, setRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [rev, setRev] = useState(0);

  const anim = FRANCE_ANIMS[animIdx];
  const frameCount = anim.framePaths.length;
  const cfgIdx = cfgIndexFor(anim, frame);
  const cfg = liveList(anim)[cfgIdx];
  const baseCfg = baselineList(anim)[Math.min(cfgIdx, baselineList(anim).length - 1)];
  const baseH = lerp(CFG.spriteMinH, CFG.spriteMaxH, depth);
  void rev;

  const state = useRef({ animIdx, frame, playing, facing, depth });
  state.current = { animIdx, frame, playing, facing, depth };
  const lockRef = useRef(lockBody);
  lockRef.current = lockBody;

  const cam = useRef({ x: -20, y: 0, z: 4 });
  const bodies = useRef<Map<string, HTMLImageElement>>(new Map());
  const heads = useRef<HeadImgs | null>(null);
  const hits = useRef<HeadHit[]>([]);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; hit: HeadHit } | null>(null);
  const pan = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);

  // ---- undo/redo (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) — same gesture grouping as the free board ----
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
  const frameGround = useCallback((z: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Ground sits at ~72% of the viewport so the bonecos + labels breathe.
    cam.current = { x: cam.current.x, y: GROUND_Y - (canvas.clientHeight * 0.72) / z, z };
  }, []);

  const fitWidth = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const z = clamp(canvas.clientWidth / (ROW_W + 60), 0.2, 8);
    cam.current.x = -30;
    frameGround(z);
  }, [frameGround]);

  const zoomTo = useCallback(
    (z: number) => {
      cam.current.x = -20;
      frameGround(z);
    },
    [frameGround],
  );

  // ---- session restore + preview assets + initial camera ----
  useEffect(() => {
    setRestored(loadFranceOverrides());
    setRev((v) => v + 1);
    const map = bodies.current;
    for (const p of new Set(FRANCE_ANIMS.flatMap((a) => a.framePaths))) {
      const img = new Image();
      img.src = p;
      map.set(p, img);
    }
    zoomTo(2);
  }, [zoomTo]);

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
      const z = clamp(c.z * Math.exp(-e.deltaY * 0.0012), 0.15, 14);
      cam.current = { x: c.x + mx / c.z - mx / z, y: c.y + my / c.z - my / z, z };
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // ---- the lineup: one row, every anim at the Bigger in-match size, guides underneath ----
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

    const drawBoneco = (a: EditorAnim, fr: number, footX: number, ai: number, base: number): void => {
      const body = bodies.current.get(a.framePaths[fr]);
      const headSet = heads.current;
      const list = liveList(a);
      const rawSizeCfg = list[0];
      const rawHeadCfg = list[Math.min(fr, list.length - 1)];
      if (!body?.complete || !body.naturalWidth || !headSet || !rawSizeCfg || !rawHeadCfg) return;
      const sizeCfg = withHeadScale(rawSizeCfg);
      const headCfg = withHeadScale(rawHeadCfg);
      const mirror = a.sideMode ? state.current.facing < 0 : false;
      // Same sizing as the France match renderer (render.ts): whole pre-trimmed frames; aspect-normalized
      // dives; dive v2 keeps its approved per-frame height ratios; head capped by headMaxFraction.
      const spriteH = a.dive
        ? (base * DIVE_LENGTH) / Math.max(1, body.naturalWidth / Math.max(1, body.naturalHeight))
        : a.id === BodyAnim.GkDiveV2
          ? spriteHeightForBase(base, sizeCfg, true) * dive2HeightRatio(fr, body, bodies.current.get(a.framePaths[0]))
          : spriteHeightForBase(base, sizeCfg, true);
      const rect = drawTrimmedSprite(ctx, body, [0, 0, body.naturalWidth, body.naturalHeight], footX, GROUND_Y, spriteH, mirror);
      if (!rect) return;
      const bounds = {
        min: CFG.headMinFraction !== undefined ? base * CFG.headMinFraction : undefined,
        max: CFG.headMaxFraction !== undefined ? base * CFG.headMaxFraction : undefined,
      };
      const hImg = headFor(headCfg, headSet);
      drawComposedHead(ctx, hImg, footX, rect, mirror, headCfg, bounds);
      const hh = composedHeadHeight(rect, headCfg, bounds);
      const hw = hImg.naturalWidth * (hh / Math.max(1, hImg.naturalHeight));
      const hx = footX - hw * 0.5 + rect.drawW * headCfg.offsetXRatio * (mirror ? -1 : 1);
      const hy = rect.drawY - rect.drawH * headCfg.headScale + rect.drawH * headCfg.offsetYRatio;
      hits.current.push({ x: hx, y: hy, w: hw, h: hh, bw: rect.drawW, bh: rect.drawH, animIdx: ai, frame: fr, mirror });
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
      const base = lerp(CFG.spriteMinH, CFG.spriteMaxH, state.current.depth);
      hits.current = [];

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#07131a';
      ctx.fillRect(0, 0, W, H);
      ctx.setTransform(dpr * z, 0, 0, dpr * z, -dpr * cx * z, -dpr * cy * z);

      const wx0 = cx;
      const wx1 = cx + W / z;

      // Guides: ground + the target base height (what body+head should read under normalizedSizes)
      // + the head cap. Every boneco is compared against the SAME two lines — that's the lineup's job.
      const x0 = Math.max(-30, wx0);
      const x1 = Math.min(ROW_W + 30, wx1);
      ctx.lineWidth = 1 / z;
      ctx.strokeStyle = 'rgba(124,239,193,0.5)';
      ctx.beginPath();
      ctx.moveTo(x0, GROUND_Y);
      ctx.lineTo(x1, GROUND_Y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(243,214,111,0.45)';
      ctx.setLineDash([3 / z, 3 / z]);
      ctx.beginPath();
      ctx.moveTo(x0, GROUND_Y - base);
      ctx.lineTo(x1, GROUND_Y - base);
      ctx.stroke();
      if (CFG.headMaxFraction !== undefined) {
        ctx.strokeStyle = 'rgba(125,211,252,0.3)';
        ctx.beginPath();
        ctx.moveTo(x0, GROUND_Y - base * CFG.headMaxFraction);
        ctx.lineTo(x1, GROUND_Y - base * CFG.headMaxFraction);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(243,214,111,0.6)';
      ctx.font = `${9 / z}px monospace`;
      ctx.fillText(`target height ${base.toFixed(1)}px`, wx0 + 8 / z, GROUND_Y - base - 3 / z);
      if (CFG.headMaxFraction !== undefined) {
        ctx.fillStyle = 'rgba(125,211,252,0.55)';
        ctx.fillText(`head cap ${(base * CFG.headMaxFraction).toFixed(1)}px`, wx0 + 8 / z, GROUND_Y - base * CFG.headMaxFraction - 3 / z);
      }

      for (let i = 0; i < FRANCE_ANIMS.length; i++) {
        const slot = SLOTS[i];
        if (slot.x > wx1 || slot.x + slot.w < wx0) continue; // cull off-screen slots
        const a = FRANCE_ANIMS[i];
        const selected = i === state.current.animIdx;
        const fr = frameOf(a, now);
        const footX = slot.x + slot.w / 2;

        if (selected) {
          ctx.strokeStyle = 'rgba(52,211,153,0.85)';
          ctx.lineWidth = 1.5 / z;
          ctx.setLineDash([4 / z, 4 / z]);
          ctx.strokeRect(slot.x + 2, GROUND_Y - base * 1.6, slot.w - 4, base * 1.6 + 16);
          ctx.setLineDash([]);
        }

        drawBoneco(a, fr, footX, i, base);

        ctx.save();
        ctx.translate(footX + 2, GROUND_Y + 6);
        ctx.rotate(Math.PI / 3.2);
        ctx.fillStyle = selected ? 'rgba(52,211,153,0.95)' : 'rgba(255,255,255,0.55)';
        ctx.font = `${6.5}px monospace`;
        ctx.fillText(a.label.replace('🧤 ', 'GK·'), 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---- pointer: head drag (offset placement) / slot click (select) / board pan ----
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
      setAnimIdx(hit.animIdx);
      setFrame(hit.frame);
      setPlaying(false);
      const a = FRANCE_ANIMS[hit.animIdx];
      const c = liveList(a)[cfgIndexFor(a, hit.frame)];
      if (!c) return;
      drag.current = { sx: wx, sy: wy, ox: c.offsetXRatio, oy: c.offsetYRatio, hit };
    } else {
      const i = SLOTS.findIndex((s) => wx >= s.x && wx < s.x + s.w);
      if (i >= 0 && wy > GROUND_Y - 260 && wy < GROUND_Y + 60) {
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

  // ---- live mutation (undoable + auto-saved, shared with the France free board) ----
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
          Bigger (variant A) · in-match sizes · drag = pan · wheel = zoom · grab a head to place it
        </div>
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <button onClick={fitWidth} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">fit width</button>
          <button onClick={() => zoomTo(4)} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">zoom 4×</button>
          <button onClick={() => zoomTo(1)} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90" title="True in-match pixel size at camera zoom 1">1:1</button>
        </div>
      </div>

      {/* Editor rail — mutates the SAME live configs + storage as /sandbox/france-match-editor. */}
      <aside className="w-[340px] shrink-0 space-y-3 overflow-y-auto border-l border-white/10 bg-black/40 p-3 text-[12px]" data-lenis-prevent>
        <div className="font-bold uppercase tracking-wide text-emerald-300">France lineup — Bigger sizes</div>
        <div className="text-[10px] text-white/50">
          base {baseH.toFixed(1)}px (spriteMinH {CFG.spriteMinH} → spriteMaxH {CFG.spriteMaxH})
          {CFG.headMaxFraction !== undefined ? ` · head cap ${(baseH * CFG.headMaxFraction).toFixed(1)}px` : ''}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/50">
          <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-emerald-300">auto-save ✓{savedAt ? ` ${savedAt}` : ''}</span>
          <span>Ctrl+Z undo · Ctrl+Shift+Z / Ctrl+Y redo</span>
        </div>
        {restored && (
          <div className="rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">
            Session overrides restored (shared with the France free board).
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={undo} className="flex-1 rounded bg-slate-700 px-2 py-1 hover:bg-slate-600">↶ Undo</button>
          <button onClick={redo} className="flex-1 rounded bg-slate-700 px-2 py-1 hover:bg-slate-600">↷ Redo</button>
        </div>

        <label className="block">
          <div className="mb-1 flex justify-between text-white/60">
            <span>Depth (far → near)</span>
            <span className="font-mono text-white/80">{depth.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.01} value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="w-full accent-amber-300" />
        </label>

        <div>
          <div className="mb-1 text-white/60">Anim (click a boneco or pick here)</div>
          <select
            value={animIdx}
            onChange={(e) => {
              setAnimIdx(Number(e.target.value));
              setFrame(0);
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
          </span>
        </div>

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

        <label className="flex items-center gap-2 rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-1.5 text-[11px]">
          <input type="checkbox" checked={lockBody} onChange={(e) => setLockBody(e.target.checked)} />
          <span>
            <span className="font-bold text-emerald-300">Lock body size</span>
            <span className="text-white/60"> — head edits never resize the body</span>
          </span>
        </label>

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
            <div className="text-[10px] text-white/40">amber • = differs from source · “all” = every anim of this character ({anim.map === 'keeper' ? 'keeper set' : 'outfield boneco'})</div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-2">
          <button onClick={() => { mark(`applyall:${animIdx}:${frame}:${Date.now()}`); applyLiveToAllLocked(anim, frame, lockRef.current); persist(); }} className="rounded bg-sky-600 px-2 py-1 text-black">Apply → all frames</button>
          <button onClick={() => { mark(`reset:${animIdx}:${Date.now()}`); resetLive(anim); persist(); }} className="rounded bg-slate-700 px-2 py-1">Reset anim</button>
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
