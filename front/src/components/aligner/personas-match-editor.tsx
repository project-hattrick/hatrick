'use client';

import { useEffect, useRef, useState } from 'react';
import { createRealGkEngine } from '@/game/realgk/engine';
import { REAL_GK_PERSONAS_CONFIG } from '@/game/realgk/config';
import { DIVE_LENGTH } from '@/game/realgk/constants';
import { drawComposedHead, drawTrimmedSprite, gkHead, spriteHeightForBase } from '@/game/realgk/composite';
import { ITEM_MAP } from '@/game/realgk/assets/items';
import { HeadView } from '@/game/realgk/enums';
import type { FrameCfg } from '@/game/realgk/assets/configs';
import type { RealGkHandle, RealGkHudPatch } from '@/game/realgk/types';
import { CrtOverlay } from '../game/real-gk/crt-overlay';
import {
  applyFieldToCharacter,
  applyLiveToAll,
  cfgIndexFor,
  clearOverrides,
  EDITOR_ANIMS,
  exportSource,
  headSrcFor,
  liveList,
  loadOverrides,
  patchLive,
  PERSONA_INDICES,
  resetAllLive,
  resetLive,
  saveOverrides,
  type NumericCfgKey,
} from './personas-match-editor-data';

/** Base drawn height (game units) for the frame-precise preview. Compositing is scale-invariant, so the
 *  relative head/body placement is IDENTICAL to the pitch — only the absolute size differs. */
const PREVIEW_BASE = 190;

type HeadImgs = { front: HTMLImageElement; back: HTMLImageElement; side: HTMLImageElement };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** frontClosed collapses to front — persona busts ship front/back/side only (same as the match loader). */
function headFor(cfg: FrameCfg, heads: HeadImgs): HTMLImageElement {
  const key = gkHead(cfg.headView);
  return key === 'back' ? heads.back : key === 'side' ? heads.side : heads.front;
}

/** Slider + typeable number (commit on Enter/blur, free of the slider's bounds) + "all" propagation. */
function SliderRow({ label, value, min, max, step, onCommit, onAll }: { label: string; value: number; min: number; max: number; step: number; onCommit: (v: number) => void; onAll: () => void }) {
  const commitText = (el: HTMLInputElement) => {
    const n = Number(el.value);
    if (Number.isFinite(n) && Math.abs(n - value) > 1e-6) onCommit(n);
  };
  return (
    <label className="flex items-center gap-2 text-[11px]">
      <span className="w-20 text-white/60">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onCommit(Number(e.target.value))} className="flex-1 accent-emerald-400" />
      <input
        key={value}
        type="number"
        step={step}
        defaultValue={Number(value.toFixed(3))}
        onKeyDown={(e) => e.key === 'Enter' && commitText(e.target as HTMLInputElement)}
        onBlur={(e) => commitText(e.target)}
        className="w-16 rounded bg-slate-800 px-1 py-0.5 text-right font-mono text-white/80"
      />
      <button onClick={onAll} title="Apply this value to every frame of EVERY anim of this character" className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] hover:bg-sky-500 hover:text-black">
        all
      </button>
    </label>
  );
}

interface HudLite {
  scoreBlue: number;
  scoreRed: number;
  clock: string;
  paused: boolean;
  speed: number;
  cameraLabel: string;
  targetLabel: string;
}

export function PersonasMatchEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const matchCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<RealGkHandle | null>(null);

  const [hud, setHud] = useState<HudLite>({ scoreBlue: 0, scoreRed: 0, clock: '00:00', paused: false, speed: 1, cameraLabel: '', targetLabel: '' });
  const [crt, setCrt] = useState(true);
  const [restored, setRestored] = useState(false);

  const [animIdx, setAnimIdx] = useState(0);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [persona, setPersona] = useState(0);
  const [showExport, setShowExport] = useState(false);
  // Bumped after every live patch so slider values re-read the mutated configs.
  const [rev, setRev] = useState(0);

  const anim = EDITOR_ANIMS[animIdx];
  const frameCount = anim.framePaths.length;
  const cfgIdx = cfgIndexFor(anim, frame);
  const cfg = liveList(anim)[cfgIdx];
  void rev;

  // Live refs the preview rAF loop reads without re-subscribing.
  const state = useRef({ animIdx, frame, facing, persona });
  state.current = { animIdx, frame, facing, persona };

  const bodies = useRef<Map<string, HTMLImageElement>>(new Map());
  const heads = useRef<HeadImgs | null>(null);
  const hitRef = useRef<{ x: number; y: number; w: number; h: number; bw: number; bh: number } | null>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; mirror: boolean; bw: number; bh: number } | null>(null);

  // ---- the real match: same engine, same config as /sandbox?cp=real-gk-personas ----
  useEffect(() => {
    const canvas = matchCanvasRef.current;
    if (!canvas) return;
    setRestored(loadOverrides());
    const handle = createRealGkEngine(canvas, {
      onHud: (patch: RealGkHudPatch) => setHud((prev) => ({ ...prev, ...patch }) as HudLite),
      config: REAL_GK_PERSONAS_CONFIG,
    });
    handleRef.current = handle;
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  // ---- preview assets ----
  useEffect(() => {
    const map = bodies.current;
    for (const p of new Set(EDITOR_ANIMS.flatMap((a) => a.framePaths))) {
      const img = new Image();
      img.src = p;
      map.set(p, img);
    }
  }, []);

  useEffect(() => {
    const src = headSrcFor(persona);
    const mk = (s: string) => {
      const i = new Image();
      i.src = s;
      return i;
    };
    heads.current = { front: mk(src.front), back: mk(src.back), side: mk(src.side) };
  }, [persona]);

  // Advance the preview frame clock at the anim's real fps.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % frameCount), Math.max(60, 1000 / (anim.fps || 6)));
    return () => window.clearInterval(id);
  }, [playing, anim, frameCount]);

  // ---- preview draw loop — the exact drawPlayer path (bbox choice, dive sizing, composed head) ----
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = () => {
      const s = state.current;
      const a = EDITOR_ANIMS[s.animIdx];
      const item = ITEM_MAP[a.id];
      const list = liveList(a);
      const fr = Math.min(s.frame, a.framePaths.length - 1);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const zoom = clamp(H / (PREVIEW_BASE * 1.4), 0.4, 3);
      const footX = W * 0.5;
      const footY = H * 0.82;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0a151d';
      ctx.fillRect(0, 0, W, H);
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (footX - footX * zoom), dpr * (footY - footY * zoom));

      // Ground + base-height reference (a normal standing player fits the dashed box).
      ctx.strokeStyle = 'rgba(124,239,193,0.35)';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.moveTo(footX - 160, footY);
      ctx.lineTo(footX + 160, footY);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(243,214,111,0.4)';
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.strokeRect(footX - PREVIEW_BASE * 0.22, footY - PREVIEW_BASE, PREVIEW_BASE * 0.44, PREVIEW_BASE);
      ctx.setLineDash([]);

      const body = bodies.current.get(a.framePaths[fr]);
      const headSet = heads.current;
      const sizeCfg = list[0];
      const headCfg = list[Math.min(fr, list.length - 1)];
      if (body?.complete && body.naturalWidth && headSet && sizeCfg && headCfg) {
        const mirror = a.sideMode ? s.facing < 0 : false;
        const fullFrame = [0, 0, body.naturalWidth, body.naturalHeight];
        // render.ts:100 — persona locomotion draws the whole (freshly trimmed) frame; keeper/outfield keep bboxes.
        const bbox = a.map === 'locomotion' ? fullFrame : item.bboxes[fr] ?? fullFrame;
        // render.ts:74-80 — dives normalize their LONGEST side to the standing height × DIVE_LENGTH.
        const diveBox = a.dive ? item.bboxes[fr] : null;
        const spriteH = diveBox
          ? (PREVIEW_BASE * DIVE_LENGTH) / Math.max(1, (diveBox[2] - diveBox[0]) / Math.max(1, diveBox[3] - diveBox[1]))
          : spriteHeightForBase(PREVIEW_BASE, sizeCfg, true);
        const rect = drawTrimmedSprite(ctx, body, bbox, footX, footY, spriteH, mirror);
        if (rect) {
          drawComposedHead(ctx, headFor(headCfg, headSet), footX, rect, mirror, headCfg);
          const hImg = headFor(headCfg, headSet);
          const hh = rect.drawH * headCfg.headScale;
          const hw = hImg.naturalWidth * (hh / Math.max(1, hImg.naturalHeight));
          const hx = footX - hw * 0.5 + rect.drawW * headCfg.offsetXRatio * (mirror ? -1 : 1);
          const hy = rect.drawY - hh + rect.drawH * headCfg.offsetYRatio;
          hitRef.current = { x: hx, y: hy, w: hw, h: hh, bw: rect.drawW, bh: rect.drawH };
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // ---- head drag on the preview ----
  const toGame = (e: React.PointerEvent) => {
    const canvas = previewCanvasRef.current!;
    const r = canvas.getBoundingClientRect();
    const H = canvas.clientHeight;
    const W = canvas.clientWidth;
    const zoom = clamp(H / (PREVIEW_BASE * 1.4), 0.4, 3);
    const footX = W * 0.5;
    const footY = H * 0.82;
    return { gx: (e.clientX - r.left - (footX - footX * zoom)) / zoom, gy: (e.clientY - r.top - (footY - footY * zoom)) / zoom };
  };

  const onDown = (e: React.PointerEvent) => {
    const hit = hitRef.current;
    if (!hit || !cfg) return;
    const { gx, gy } = toGame(e);
    if (gx >= hit.x && gx <= hit.x + hit.w && gy >= hit.y && gy <= hit.y + hit.h) {
      const mirror = anim.sideMode ? facing < 0 : false;
      drag.current = { sx: gx, sy: gy, ox: cfg.offsetXRatio, oy: cfg.offsetYRatio, mirror, bw: hit.bw, bh: hit.bh };
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const { gx, gy } = toGame(e);
    patch({
      offsetXRatio: clamp(d.ox + (gx - d.sx) / (d.bw * (d.mirror ? -1 : 1)), -0.6, 0.6),
      offsetYRatio: clamp(d.oy + (gy - d.sy) / d.bh, -0.2, 0.8),
    });
  };
  const onUp = () => {
    drag.current = null;
  };

  // ---- live mutation: the match canvas shows every change on its next rendered frame ----
  function patch(part: Partial<FrameCfg>): void {
    patchLive(anim, frame, part);
    saveOverrides();
    setRev((v) => v + 1);
  }

  // Slider row wiring: live patch on scrub/type; "all" pushes the value onto every anim of this character.
  const fieldValue = (k: NumericCfgKey): number => (cfg?.[k] as number | undefined) ?? (k === 'sizeScale' ? 1 : 0);
  const row = (label: string, k: NumericCfgKey, min: number, max: number, step: number) => (
    <SliderRow
      label={label}
      value={fieldValue(k)}
      min={min}
      max={max}
      step={step}
      onCommit={(v) => patch({ [k]: v } as Partial<FrameCfg>)}
      onAll={() => {
        applyFieldToCharacter(anim, k, fieldValue(k));
        saveOverrides();
        setRev((v) => v + 1);
      }}
    />
  );

  const handle = handleRef.current;

  return (
    <div className="flex h-screen w-full select-none bg-[#06222f] text-white">
      {/* THE game — real engine, real config, zero re-implementation. */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <canvas ref={matchCanvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />
        {crt && <CrtOverlay />}
        <div className="pointer-events-none absolute left-3 top-3 rounded border border-white/15 bg-black/60 px-3 py-2 font-mono text-[11px] text-white/70">
          real-gk-personas · {hud.scoreBlue}–{hud.scoreRed} · {hud.clock} {hud.paused ? '· PAUSED' : ''} {hud.speed !== 1 ? `· ${hud.speed}x` : ''}
          <div className="text-emerald-300/80">this IS the match — edits on the right land here live</div>
        </div>
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          <button onClick={() => handle?.togglePause()} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">{hud.paused ? '▶ resume' : '❚❚ pause'}</button>
          <button onClick={() => handle?.cycleSpeed()} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">speed {hud.speed}x</button>
          <button onClick={() => handle?.debugGoal()} className="rounded bg-emerald-600/80 px-2.5 py-1 font-mono text-[11px] hover:bg-emerald-500">⚽ shot at goal (dive)</button>
          <button onClick={() => handle?.debugAction('powershot')} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">persona shot</button>
          <button onClick={() => handle?.cycleCamera()} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">{hud.cameraLabel || 'camera'}</button>
          <button onClick={() => handle?.cycleTarget()} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">{hud.targetLabel || 'follow'}</button>
          <button onClick={() => handle?.restart()} className="rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] hover:bg-black/90">kickoff</button>
          <label className="flex items-center gap-1 rounded bg-black/70 px-2.5 py-1 font-mono text-[11px]">
            <input type="checkbox" checked={crt} onChange={(e) => setCrt(e.target.checked)} />
            crt
          </label>
        </div>
      </div>

      {/* Editor rail — mutates the SAME config objects the renderer reads. */}
      <aside className="w-[340px] shrink-0 space-y-3 overflow-y-auto border-l border-white/10 bg-black/40 p-3 text-[12px]">
        <div className="font-bold uppercase tracking-wide text-emerald-300">Personas match editor</div>
        {restored && (
          <div className="rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">
            Session overrides restored (editor-only). “Reset all” discards them.
          </div>
        )}

        <div>
          <div className="mb-1 text-white/60">Anim</div>
          <select
            value={animIdx}
            onChange={(e) => {
              setAnimIdx(Number(e.target.value));
              setFrame(0);
            }}
            className="w-full rounded bg-slate-800 px-2 py-1"
          >
            {EDITOR_ANIMS.map((a, i) => (
              <option key={a.id} value={i}>
                {a.map === 'keeper' ? '🧤 ' : ''}{a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Frame-precise preview: same composite fns + live configs = same pixels as the pitch. */}
        <canvas
          ref={previewCanvasRef}
          className="h-56 w-full cursor-grab touch-none rounded border border-white/10"
          style={{ imageRendering: 'pixelated' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
        <div className="text-[10px] text-white/40">drag the head to place it · dashed box = standing player height</div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="rounded bg-slate-700 px-3 py-1">{playing ? '❚❚' : '▶'}</button>
          <button onClick={() => { setPlaying(false); setFrame((f) => (f - 1 + frameCount) % frameCount); }} className="rounded bg-slate-700 px-2 py-1">‹</button>
          <button onClick={() => { setPlaying(false); setFrame((f) => (f + 1) % frameCount); }} className="rounded bg-slate-700 px-2 py-1">›</button>
          <span className="ml-auto font-mono text-white/60">
            frame {frame + 1}/{frameCount}
            {liveList(anim).length < frameCount ? ` · cfg ${cfgIdx + 1}/${liveList(anim).length} (shared)` : ''}
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

        {cfg && (
          <div className="space-y-1.5 border-t border-white/10 pt-2">
            <div className="mb-1 font-bold uppercase text-emerald-300">Head — frame {cfgIdx + 1}</div>
            <label className="flex items-center gap-2 text-[11px]">
              <span className="w-20 text-white/60">view</span>
              <select value={cfg.headView} onChange={(e) => patch({ headView: e.target.value as HeadView })} className="flex-1 rounded bg-slate-800 px-1 py-0.5">
                <option value={HeadView.Front}>Front</option>
                <option value={HeadView.Back}>Back</option>
                <option value={HeadView.Side}>Side</option>
              </select>
            </label>
            {row('headScale', 'headScale', 0.1, 0.9, 0.005)}
            {row('offsetX', 'offsetXRatio', -0.4, 0.5, 0.002)}
            {row('offsetY', 'offsetYRatio', -0.15, 0.6, 0.002)}
            {row('sizeScale', 'sizeScale', 0.4, 1.4, 0.01)}
            <div className="text-[10px] text-white/40">type a value + Enter (free of slider bounds) · “all” = every anim of this character ({anim.map === 'keeper' ? 'keeper set' : 'outfield boneco'})</div>
            <label className="flex items-center gap-2 text-[11px]">
              <input type="checkbox" checked={cfg.headFlip ?? false} onChange={(e) => patch({ headFlip: e.target.checked })} />
              <span className="text-white/60">headFlip (extra mirror — usually leave OFF)</span>
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-2">
          <button onClick={() => { applyLiveToAll(anim, frame); saveOverrides(); setRev((v) => v + 1); }} className="rounded bg-sky-600 px-2 py-1 text-black">Apply → all frames</button>
          <button onClick={() => { resetLive(anim); saveOverrides(); setRev((v) => v + 1); }} className="rounded bg-slate-700 px-2 py-1">Reset anim</button>
          <button onClick={() => { resetAllLive(); clearOverrides(); setRestored(false); setRev((v) => v + 1); }} className="rounded bg-red-900/80 px-2 py-1">Reset all</button>
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
