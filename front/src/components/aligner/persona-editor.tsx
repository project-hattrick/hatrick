'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { HeadView } from '@/game/realgk/enums';
import { drawComposedHead, drawTrimmedSprite, gkHead, spriteHeightForBase } from '@/game/realgk/composite';
import {
  COURT_BG,
  EDITOR_BASE,
  exportSource,
  freshConfigs,
  headSrcFor,
  PERSONA_ANIMS,
  PERSONA_INDICES,
  STORAGE_KEY,
  type EditCfg,
} from './persona-editor-data';

type HeadImgs = { front: HTMLImageElement; back: HTMLImageElement; side: HTMLImageElement };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** The persona head this cfg's view composites (frontClosed collapses to front — persona has no closed bust). */
function headFor(cfg: EditCfg, heads: HeadImgs): HTMLImageElement {
  const key = gkHead(cfg.headView);
  return key === 'back' ? heads.back : key === 'side' ? heads.side : heads.front;
}

export function PersonaEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [configs, setConfigs] = useState<Record<string, EditCfg[]>>(() => {
    const seed = freshConfigs();
    if (typeof window === 'undefined') return seed;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...seed, ...JSON.parse(saved) };
    } catch {
      /* ignore */
    }
    return seed;
  });
  const [animIdx, setAnimIdx] = useState(0);
  const [persona, setPersona] = useState(0);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [guides, setGuides] = useState(true);
  const [showCourt, setShowCourt] = useState(true);
  const [ready, setReady] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const anim = PERSONA_ANIMS[animIdx];
  const frameCount = anim.framePaths.length;
  const cfg = configs[anim.id]?.[frame] ?? configs[anim.id]?.[0];

  // Live refs the rAF loop reads without re-subscribing.
  const state = useRef({ animIdx, persona, frame, playing, facing, guides, showCourt, configs });
  state.current = { animIdx, persona, frame, playing, facing, guides, showCourt, configs };

  const bodies = useRef<Map<string, HTMLImageElement>>(new Map());
  const heads = useRef<HeadImgs | null>(null);
  const courtImg = useRef<HTMLImageElement | null>(null);
  const hitRef = useRef<{ x: number; y: number; w: number; h: number; body: { drawW: number; drawH: number } } | null>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; zoom: number; mirror: boolean; bw: number; bh: number } | null>(null);

  // Load all body frames once + the court.
  useEffect(() => {
    const map = bodies.current;
    const jobs: Promise<unknown>[] = [];
    for (const p of new Set(PERSONA_ANIMS.flatMap((a) => a.framePaths))) {
      const img = new Image();
      img.src = p;
      map.set(p, img);
      jobs.push(img.decode().catch(() => null));
    }
    const c = new Image();
    c.src = COURT_BG;
    courtImg.current = c;
    jobs.push(c.decode().catch(() => null));
    Promise.all(jobs).finally(() => setReady(true));
  }, []);

  // (Re)load the selected persona's heads.
  useEffect(() => {
    const src = headSrcFor(persona);
    const mk = (s: string) => {
      const i = new Image();
      i.src = s;
      return i;
    };
    const set: HeadImgs = { front: mk(src.front), back: mk(src.back), side: mk(src.side) };
    heads.current = set;
    Promise.all([set.front.decode(), set.back.decode(), set.side.decode()].map((p) => p.catch(() => null)));
  }, [persona]);

  // Persist edits.
  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  }, [configs, ready]);

  // Advance the frame clock when playing.
  useEffect(() => {
    if (!playing) return;
    const fps = anim.fps || 6;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % frameCount), Math.max(60, 1000 / fps));
    return () => window.clearInterval(id);
  }, [playing, anim, frameCount]);

  // The draw loop — mirrors the match render exactly via the shared composite fns.
  useEffect(() => {
    const canvas = canvasRef.current;
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
      const a = PERSONA_ANIMS[s.animIdx];
      const list = s.configs[a.id] ?? [];
      const fr = Math.min(s.frame, list.length - 1);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const zoom = clamp(H / (EDITOR_BASE * 1.7), 0.5, 4);
      const footX = W * 0.5;
      const footY = H * 0.72;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, W, H);

      // Backdrop.
      if (s.showCourt && courtImg.current?.complete && courtImg.current.naturalWidth) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(courtImg.current, 0, 0, W, H);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = '#0a151d';
        ctx.fillRect(0, 0, W, H);
      }

      // Work in game units around the foot point.
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (footX - footX * zoom), dpr * (footY - footY * zoom));

      if (s.guides) {
        ctx.strokeStyle = 'rgba(124,239,193,0.35)';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        ctx.moveTo(footX - 120, footY);
        ctx.lineTo(footX + 120, footY);
        ctx.moveTo(footX, footY - EDITOR_BASE - 30);
        ctx.lineTo(footX, footY + 20);
        ctx.stroke();
        // Reference: a normal player fits in this base-height box.
        ctx.strokeStyle = 'rgba(243,214,111,0.5)';
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.strokeRect(footX - EDITOR_BASE * 0.22, footY - EDITOR_BASE, EDITOR_BASE * 0.44, EDITOR_BASE);
        ctx.setLineDash([]);
      }

      const body = bodies.current.get(a.framePaths[fr]);
      const headSet = heads.current;
      const sizeCfg = list[0]; // match sizes off frame 0 so per-frame head offsets never pulse the body
      const headCfg = list[fr];
      if (body?.complete && body.naturalWidth && headSet && sizeCfg && headCfg) {
        const spriteH = spriteHeightForBase(EDITOR_BASE, sizeCfg, true);
        const mirror = a.sideMode ? s.facing < 0 : false;
        const bbox = [0, 0, body.naturalWidth, body.naturalHeight];
        const rect = drawTrimmedSprite(ctx, body, bbox, footX, footY, spriteH, mirror);
        if (rect) {
          drawComposedHead(ctx, headFor(headCfg, headSet), footX, rect, mirror, headCfg);
          // Head hit-box (game units) for drag.
          const hh = rect.drawH * headCfg.headScale;
          const hImg = headFor(headCfg, headSet);
          const hw = hImg.naturalWidth * (hh / Math.max(1, hImg.naturalHeight));
          const hx = footX - hw * 0.5 + rect.drawW * headCfg.offsetXRatio * (mirror ? -1 : 1);
          const hy = rect.drawY - hh + rect.drawH * headCfg.offsetYRatio;
          hitRef.current = { x: hx, y: hy, w: hw, h: hh, body: { drawW: rect.drawW, drawH: rect.drawH } };
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

  // ---- head drag ----
  const toGame = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const zoom = clamp(H / (EDITOR_BASE * 1.7), 0.5, 4);
    const footX = W * 0.5;
    const footY = H * 0.72;
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    // Inverse of the loop's game-unit transform.
    return { gx: (sx - (footX - footX * zoom)) / zoom, gy: (sy - (footY - footY * zoom)) / zoom, zoom };
  };

  const onDown = (e: React.PointerEvent) => {
    const hit = hitRef.current;
    if (!hit) return;
    const { gx, gy, zoom } = toGame(e);
    if (gx >= hit.x && gx <= hit.x + hit.w && gy >= hit.y && gy <= hit.y + hit.h) {
      const mirror = anim.sideMode ? facing < 0 : false;
      drag.current = { sx: gx, sy: gy, ox: cfg.offsetXRatio, oy: cfg.offsetYRatio, zoom, mirror, bw: hit.body.drawW, bh: hit.body.drawH };
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const { gx, gy } = toGame(e);
    const dOX = (gx - d.sx) / (d.bw * (d.mirror ? -1 : 1));
    const dOY = (gy - d.sy) / d.bh;
    patch({ offsetXRatio: clamp(d.ox + dOX, -0.6, 0.6), offsetYRatio: clamp(d.oy + dOY, -0.2, 0.6) });
  };
  const onUp = () => {
    drag.current = null;
  };

  // ---- config mutation ----
  function patch(part: Partial<EditCfg>): void {
    setConfigs((prev) => {
      const list = (prev[anim.id] ?? []).map((c, i) => (i === frame ? { ...c, ...part } : c));
      return { ...prev, [anim.id]: list };
    });
  }
  function applyToAll(): void {
    setConfigs((prev) => {
      const cur = prev[anim.id]?.[frame];
      if (!cur) return prev;
      return { ...prev, [anim.id]: (prev[anim.id] ?? []).map(() => ({ ...cur })) };
    });
  }
  function resetAnim(): void {
    setConfigs((prev) => ({ ...prev, [anim.id]: freshConfigs()[anim.id] }));
  }

  const exportText = useMemo(() => (showExport ? exportSource(configs) : ''), [showExport, configs]);

  const Slider = ({ label, k, min, max, step }: { label: string; k: keyof EditCfg; min: number; max: number; step: number }) => (
    <label className="flex items-center gap-2 text-[11px]">
      <span className="w-20 text-white/60">{label}</span>
      <input type="range" min={min} max={max} step={step} value={cfg[k] as number} onChange={(e) => patch({ [k]: Number(e.target.value) } as Partial<EditCfg>)} className="flex-1 accent-emerald-400" />
      <span className="w-12 text-right font-mono text-white/80">{(cfg[k] as number).toFixed(3)}</span>
    </label>
  );

  return (
    <div className="flex h-screen w-full bg-[#06222f] text-white">
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-grab touch-none"
          style={{ imageRendering: 'pixelated' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
        {!ready && <div className="absolute inset-0 grid place-items-center font-mono text-xs uppercase text-white/60">Loading…</div>}
        <div className="pointer-events-none absolute left-3 top-3 rounded border border-white/15 bg-black/60 px-3 py-2 font-mono text-[11px] text-white/70">
          {anim.label} · frame {frame + 1}/{frameCount} · p{String(persona + 1).padStart(2, '0')} · facing {facing > 0 ? '→' : '←'}
          <div className="text-emerald-300/80">drag the head to place it · reflects the match 1:1</div>
        </div>
      </div>

      <aside className="w-[300px] shrink-0 space-y-3 overflow-y-auto border-l border-white/10 bg-black/40 p-3 text-[12px]">
        <div>
          <div className="mb-1 font-bold uppercase text-emerald-300">Anim</div>
          <select value={animIdx} onChange={(e) => { setAnimIdx(Number(e.target.value)); setFrame(0); }} className="w-full rounded bg-slate-800 px-2 py-1">
            {PERSONA_ANIMS.map((a, i) => <option key={a.id} value={i}>{a.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="rounded bg-slate-700 px-3 py-1">{playing ? '❚❚' : '▶'}</button>
          <button onClick={() => { setPlaying(false); setFrame((f) => (f - 1 + frameCount) % frameCount); }} className="rounded bg-slate-700 px-2 py-1">‹</button>
          <button onClick={() => { setPlaying(false); setFrame((f) => (f + 1) % frameCount); }} className="rounded bg-slate-700 px-2 py-1">›</button>
          <span className="ml-auto font-mono text-white/60">{frame + 1}/{frameCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/60">Facing</span>
          <button onClick={() => setFacing(-1)} className={`rounded px-2 py-1 ${facing < 0 ? 'bg-emerald-500 text-black' : 'bg-slate-700'}`}>← Left</button>
          <button onClick={() => setFacing(1)} className={`rounded px-2 py-1 ${facing > 0 ? 'bg-emerald-500 text-black' : 'bg-slate-700'}`}>Right →</button>
        </div>

        <div>
          <div className="mb-1 text-white/60">Persona head</div>
          <select value={persona} onChange={(e) => setPersona(Number(e.target.value))} className="w-full rounded bg-slate-800 px-2 py-1">
            {PERSONA_INDICES.map((i) => <option key={i} value={i}>p{String(i + 1).padStart(2, '0')}</option>)}
          </select>
        </div>

        <div className="space-y-1.5 border-t border-white/10 pt-2">
          <div className="mb-1 font-bold uppercase text-emerald-300">Head — frame {frame + 1}</div>
          <label className="flex items-center gap-2 text-[11px]">
            <span className="w-20 text-white/60">view</span>
            <select value={cfg.headView} onChange={(e) => patch({ headView: e.target.value as HeadView })} className="flex-1 rounded bg-slate-800 px-1 py-0.5">
              <option value={HeadView.Front}>Front</option>
              <option value={HeadView.Back}>Back</option>
              <option value={HeadView.Side}>Side</option>
            </select>
          </label>
          <Slider label="headScale" k="headScale" min={0.2} max={0.9} step={0.005} />
          <Slider label="offsetX" k="offsetXRatio" min={-0.4} max={0.4} step={0.002} />
          <Slider label="offsetY" k="offsetYRatio" min={-0.15} max={0.5} step={0.002} />
          <Slider label="sizeScale" k="sizeScale" min={0.4} max={1.4} step={0.01} />
          <label className="flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={cfg.headFlip} onChange={(e) => patch({ headFlip: e.target.checked })} />
            <span className="text-white/60">headFlip (extra mirror — usually leave OFF)</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-2">
          <button onClick={applyToAll} className="rounded bg-sky-600 px-2 py-1 text-black">Apply → all frames</button>
          <button onClick={resetAnim} className="rounded bg-slate-700 px-2 py-1">Reset anim</button>
          <label className="flex items-center gap-1 text-white/60"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />guides</label>
          <label className="flex items-center gap-1 text-white/60"><input type="checkbox" checked={showCourt} onChange={(e) => setShowCourt(e.target.checked)} />court</label>
        </div>

        <div className="border-t border-white/10 pt-2">
          <button onClick={() => setShowExport((v) => !v)} className="w-full rounded bg-emerald-500 px-2 py-1 font-bold text-black">{showExport ? 'Hide export' : 'Export configs'}</button>
          {showExport && <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-950 p-2 text-[9.5px] leading-tight text-emerald-200">{exportText}</pre>}
        </div>
      </aside>
    </div>
  );
}
