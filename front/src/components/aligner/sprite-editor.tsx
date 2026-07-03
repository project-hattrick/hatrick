'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { HeadView } from '@/game/realgk/enums';
import {
  EDITOR_ANIMS,
  exportSource,
  freshConfigs,
  HEAD_SRC,
  HEAD_VIEWS,
  seedCfg,
  STORAGE_KEY,
  type EditCfg,
} from './sprite-editor-data';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const GAP = 26; // world-units between sprites
const ORIGIN_X = 60;

interface Cam {
  x: number;
  y: number;
  zoom: number;
}
interface Toggles {
  baseline: boolean;
  headline: boolean;
  headBox: boolean;
  group: 'All' | 'Goalkeeper' | 'Outfield';
}
interface Sel {
  animId: string;
  frame: number;
}
interface HitRect {
  animId: string;
  frame: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

type Images = { body: Map<string, HTMLImageElement>; heads: Partial<Record<HeadView, HTMLImageElement>> };

/** Lays out every frame in one straight line and paints them; fills `hits` with screen rects. */
function drawScene(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  imgs: Images,
  configs: Record<string, EditCfg[]>,
  cam: Cam,
  base: number,
  toggles: Toggles,
  headlineY: number,
  sel: Sel,
  hits: HitRect[],
): void {
  hits.length = 0;
  const originY = H * 0.72;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, W, H);

  const toScreenX = (wx: number) => ORIGIN_X + (wx - cam.x) * cam.zoom;
  const toScreenY = (wy: number) => originY + (wy - cam.y) * cam.zoom;

  // Baseline (feet) at world y = 0.
  if (toggles.baseline) {
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, toScreenY(0));
    ctx.lineTo(W, toScreenY(0));
    ctx.stroke();
  }

  const anims = EDITOR_ANIMS.filter((a) => toggles.group === 'All' || a.group === toggles.group);
  let cursor = 0;
  for (const anim of anims) {
    const labelX = toScreenX(cursor);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText(`${anim.label}`, labelX, toScreenY(0) + 22);

    anim.framePaths.forEach((path, i) => {
      const cfg = configs[anim.id][i];
      const body = imgs.body.get(path);
      const head = imgs.heads[cfg.headView] ?? imgs.heads[HeadView.Front];
      const bbox = anim.bboxes[i];
      if (!body || !body.complete || !body.naturalWidth || !head || !head.complete || !head.naturalWidth) {
        cursor += 60 + GAP;
        return;
      }
      const [l, t, r, b] = bbox ?? [0, 0, body.naturalWidth, body.naturalHeight];
      const bw = Math.max(1, r - l);
      const bh = Math.max(1, b - t);
      const drawBH = (base / Math.max(0.75, 1 + cfg.headScale - cfg.offsetYRatio)) * cfg.sizeScale;
      const drawBW = bw * (drawBH / bh);

      const bodyScreenX = toScreenX(cursor);
      const bodyScreenTop = toScreenY(-drawBH);
      const bw2 = drawBW * cam.zoom;
      const bh2 = drawBH * cam.zoom;
      ctx.drawImage(body, l, t, bw, bh, bodyScreenX, bodyScreenTop, bw2, bh2);

      const headHw = drawBH * cfg.headScale;
      const headWw = head.naturalWidth * (headHw / head.naturalHeight);
      const headLeftW = cursor + drawBW / 2 - headWw / 2 + drawBW * cfg.offsetXRatio;
      const headTopW = -drawBH - headHw + drawBH * cfg.offsetYRatio;
      const hx = toScreenX(headLeftW);
      const hy = toScreenY(headTopW);
      const hw = headWw * cam.zoom;
      const hh = headHw * cam.zoom;
      // Side heads render mirrored by default; headFlip flips the look direction (XOR).
      const mirrorHead = (cfg.headView === HeadView.Side) !== cfg.headFlip;
      if (mirrorHead) {
        ctx.save();
        ctx.translate(hx + hw, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(head, 0, hy, hw, hh);
        ctx.restore();
      } else {
        ctx.drawImage(head, hx, hy, hw, hh);
      }
      if (toggles.headBox) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(hx, hy, hw, hh);
      }

      const rx = Math.min(bodyScreenX, hx);
      const ry = Math.min(bodyScreenTop, hy);
      const rw = Math.max(bodyScreenX + bw2, hx + hw) - rx;
      const rh = toScreenY(0) - ry;
      hits.push({ animId: anim.id, frame: i, x: rx, y: ry, w: rw, h: rh });

      const isSel = sel.animId === anim.id && sel.frame === i;
      ctx.strokeStyle = isSel ? '#38bdf8' : 'rgba(148,163,184,0.22)';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(rx - 2, ry - 2, rw + 4, rh + 4);
      ctx.fillStyle = '#475569';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(`f${i + 1} · ${Math.round(hh)}px`, rx, toScreenY(0) + 12);

      cursor += drawBW + GAP;
    });
    cursor += GAP;
  }

  // Movable head guide line.
  if (toggles.headline) {
    const y = toScreenY(headlineY);
    ctx.strokeStyle = 'rgba(250,204,21,0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(250,204,21,0.95)';
    ctx.fillText('guide', 8, y - 5);
  }
}

/** Dev tool: every composited sprite on one pannable line; drag to move heads, tune on the right. */
export function SpriteEditor() {
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
  const [sel, setSel] = useState<Sel>({ animId: EDITOR_ANIMS[0].id, frame: 0 });
  const [base, setBase] = useState(120);
  const [cam, setCam] = useState<Cam>({ x: 0, y: -70, zoom: 1 });
  const [headlineY, setHeadlineY] = useState(-150);
  const [toggles, setToggles] = useState<Toggles>({ baseline: true, headline: false, headBox: false, group: 'All' });
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ w: 1000, h: 760 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitsRef = useRef<HitRect[]>([]);
  const drag = useRef<
    | { mode: 'pan'; sx: number; sy: number; cx: number; cy: number }
    | { mode: 'head'; sx: number; sy: number; ox: number; oy: number; w: number; h: number }
    | { mode: 'headline'; sy: number; hy: number }
    | null
  >(null);

  const [imgs] = useState<Images>(() => {
    const body = new Map<string, HTMLImageElement>();
    const heads: Partial<Record<HeadView, HTMLImageElement>> = {};
    if (typeof window !== 'undefined') {
      for (const p of new Set(EDITOR_ANIMS.flatMap((a) => a.framePaths))) {
        const img = new Image();
        img.src = p;
        body.set(p, img);
      }
      for (const v of HEAD_VIEWS) {
        const img = new Image();
        img.src = HEAD_SRC[v];
        heads[v] = img;
      }
    }
    return { body, heads };
  });

  useEffect(() => {
    const all = [...imgs.body.values(), ...Object.values(imgs.heads)];
    Promise.all(all.map((i) => i.decode().catch(() => null))).finally(() => setReady(true));
  }, [imgs]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  }, [configs, ready]);

  // Redraw on any relevant change.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawScene(ctx, size.w, size.h, imgs, configs, cam, base, toggles, headlineY, sel, hitsRef.current);
  }, [configs, cam, base, toggles, headlineY, sel, size, ready, imgs]);

  const patchFrame = (animId: string, frame: number, patch: Partial<EditCfg>) =>
    setConfigs((c) => {
      const list = c[animId].slice();
      list[frame] = { ...list[frame], ...patch };
      return { ...c, [animId]: list };
    });

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
    const originY = size.h * 0.72;
    const guideScreenY = originY + (headlineY - cam.y) * cam.zoom;
    if (toggles.headline && Math.abs(p.y - guideScreenY) < 8) {
      drag.current = { mode: 'headline', sy: p.y, hy: headlineY };
      return;
    }
    const hit = [...hitsRef.current].reverse().find((h) => p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h);
    if (hit) {
      setSel({ animId: hit.animId, frame: hit.frame });
      const cfg = configs[hit.animId][hit.frame];
      drag.current = { mode: 'head', sx: p.x, sy: p.y, ox: cfg.offsetXRatio, oy: cfg.offsetYRatio, w: hit.w, h: hit.h };
      return;
    }
    drag.current = { mode: 'pan', sx: p.x, sy: p.y, cx: cam.x, cy: cam.y };
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const p = pos(e);
    const d = drag.current;
    if (d.mode === 'pan') {
      setCam((c) => ({ ...c, x: d.cx - (p.x - d.sx) / c.zoom, y: d.cy - (p.y - d.sy) / c.zoom }));
    } else if (d.mode === 'headline') {
      setHeadlineY(d.hy + (p.y - d.sy) / cam.zoom);
    } else {
      const dw = d.w || 100;
      const dh = d.h || 100;
      patchFrame(sel.animId, sel.frame, {
        offsetXRatio: clamp(d.ox + (p.x - d.sx) / dw, -1, 1),
        offsetYRatio: clamp(d.oy + (p.y - d.sy) / dh, -1, 1),
      });
    }
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const originY = size.h * 0.72;
    setCam((c) => {
      const nz = clamp(c.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 0.25, 4);
      // keep the world point under the cursor fixed
      const wx = (mx - ORIGIN_X) / c.zoom + c.x;
      const wy = (my - originY) / c.zoom + c.y;
      return { x: wx - (mx - ORIGIN_X) / nz, y: wy - (my - originY) / nz, zoom: nz };
    });
  };

  const applyHeadSize = (scope: 'anim' | 'all') => {
    const selCfg = configs[sel.animId]?.[sel.frame];
    if (!selCfg) return;
    setConfigs((c) => {
      const next = { ...c };
      const ids = scope === 'anim' ? [sel.animId] : EDITOR_ANIMS.map((a) => a.id);
      for (const id of ids) next[id] = next[id].map((f) => ({ ...f, headScale: selCfg.headScale }));
      return next;
    });
  };

  const selCfg = configs[sel.animId]?.[sel.frame];
  const source = useMemo(() => exportSource(configs), [configs]);

  return (
    <div className="flex h-screen text-slate-100">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 p-2 text-xs">
          {(['All', 'Goalkeeper', 'Outfield'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setToggles((t) => ({ ...t, group: g }))}
              className={`rounded px-2.5 py-1 ${toggles.group === g ? 'bg-sky-500 text-black' : 'bg-slate-700'}`}
            >
              {g}
            </button>
          ))}
          <label className="ml-1 flex items-center gap-1">
            <input type="checkbox" checked={toggles.baseline} onChange={(e) => setToggles((t) => ({ ...t, baseline: e.target.checked }))} />
            baseline
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={toggles.headline} onChange={(e) => setToggles((t) => ({ ...t, headline: e.target.checked }))} />
            guide line
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={toggles.headBox} onChange={(e) => setToggles((t) => ({ ...t, headBox: e.target.checked }))} />
            head box
          </label>
          <label className="ml-1 flex items-center gap-1">
            base
            <input type="range" min={70} max={180} value={base} onChange={(e) => setBase(+e.target.value)} />
          </label>
          <button onClick={() => setCam({ x: 0, y: -70, zoom: 1 })} className="rounded bg-slate-700 px-2.5 py-1">
            Reset view
          </button>
          <span className="text-slate-500">drag empty = pan · wheel = zoom · drag sprite = move head</span>
        </div>
        <div ref={containerRef} className="relative min-h-0 flex-1">
          <canvas
            ref={canvasRef}
            width={size.w}
            height={size.h}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={() => (drag.current = null)}
            onWheel={onWheel}
            className="block h-full w-full"
            style={{ touchAction: 'none', cursor: 'grab' }}
          />
        </div>
      </div>

      <aside className="w-[320px] shrink-0 overflow-auto border-l border-slate-700 bg-slate-900/60 p-4">
        {selCfg ? (
          <>
            <h2 className="text-sm font-semibold">
              {EDITOR_ANIMS.find((a) => a.id === sel.animId)?.label} — frame {sel.frame + 1}
            </h2>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <div className="mb-1 text-slate-400">Head view (look direction)</div>
                <div className="flex flex-wrap gap-1">
                  {HEAD_VIEWS.map((v) => (
                    <button
                      key={v}
                      onClick={() => patchFrame(sel.animId, sel.frame, { headView: v })}
                      className={`rounded px-2 py-1 ${selCfg.headView === v ? 'bg-sky-500 text-black' : 'bg-slate-700'}`}
                    >
                      {v}
                    </button>
                  ))}
                  <button
                    onClick={() => patchFrame(sel.animId, sel.frame, { headFlip: !selCfg.headFlip })}
                    className={`rounded px-2 py-1 ${selCfg.headFlip ? 'bg-amber-400 text-black' : 'bg-slate-700'}`}
                    title="Mirror the head horizontally"
                  >
                    ⟷ Flip
                  </button>
                </div>
              </div>
              {(
                [
                  ['headScale', 'Head size', 0.1, 1.2, 0.005],
                  ['sizeScale', 'Body size', 0.3, 2, 0.01],
                  ['bodyScale', 'Body scale (legacy)', 0.3, 1.4, 0.01],
                  ['offsetXRatio', 'Head X', -0.6, 0.6, 0.005],
                  ['offsetYRatio', 'Head Y', -0.3, 0.6, 0.005],
                ] as const
              ).map(([key, label, lo, hi, step]) => (
                <label key={key} className="block">
                  <div className="mb-0.5 flex items-center justify-between text-slate-400">
                    <span>{label}</span>
                    <input
                      type="number"
                      step={step}
                      value={Number(selCfg[key].toFixed(3))}
                      onChange={(e) => patchFrame(sel.animId, sel.frame, { [key]: +e.target.value })}
                      className="w-20 rounded bg-slate-800 px-1 py-0.5 text-right tabular-nums text-slate-200"
                    />
                  </div>
                  <input
                    type="range"
                    min={lo}
                    max={hi}
                    step={step}
                    value={clamp(selCfg[key], lo, hi)}
                    onChange={(e) => patchFrame(sel.animId, sel.frame, { [key]: +e.target.value })}
                    className="w-full"
                  />
                </label>
              ))}
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => applyHeadSize('anim')} className="rounded bg-slate-700 px-2 py-1">
                  Head size → this anim
                </button>
                <button onClick={() => applyHeadSize('all')} className="rounded bg-slate-700 px-2 py-1">
                  → all anims
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => patchFrame(sel.animId, sel.frame, seedCfg(sel.animId, sel.frame))}
                  className="mt-1 flex-1 rounded bg-slate-700 px-2 py-1"
                >
                  Reset frame
                </button>
                <button onClick={() => setConfigs(freshConfigs())} className="mt-1 flex-1 rounded bg-slate-700 px-2 py-1">
                  Reset all
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-400">Click a sprite to edit.</p>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300">configs.ts export</h3>
            <div className="flex gap-1">
              <button onClick={() => navigator.clipboard?.writeText(source)} className="rounded bg-slate-700 px-2 py-1 text-xs font-medium">
                Copy
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([source], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'realgk-sprite-configs.ts';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded bg-sky-600 px-2 py-1 text-xs font-medium"
              >
                Download
              </button>
            </div>
          </div>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-950 p-2 text-[10px] leading-tight text-emerald-300">
            {source}
          </pre>
        </div>
      </aside>
    </div>
  );
}
