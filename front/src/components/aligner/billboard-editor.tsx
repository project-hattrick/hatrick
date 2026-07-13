'use client';

import { useEffect, useRef, useState } from 'react';
import { LightBoard } from '@/components/common/light-board';
import { BillboardKind, BILLBOARDS, drawImageQuad, type Billboard } from '@/game/realgk/billboards';
import { drawLedMarquee, LED_THEMES } from '@/lib/led/marquee';

const CW = 900;
const CH = 520;
const COURT_SRC = '/game/stadiums/rain-court/court.png';

const AD_IMAGES = [
  '/game/ads/hatrick.svg',
  '/game/ads/txodds.svg',
  '/game/ads/solana.svg',
  '/game/ads/txline.svg',
  '/game/ads/worldcup26.svg',
  '/game/ads/playlive.svg',
];
const THEME_KEYS = Object.keys(LED_THEMES) as (keyof typeof LED_THEMES)[];

/** Editor board = a Billboard whose corners are edited as ratios (0..1) of the court image. */
type Board = Required<Pick<Billboard, 'kind' | 'corners'>> & Omit<Billboard, 'kind' | 'corners'>;

const newBoard = (): Board => ({
  kind: BillboardKind.Led,
  corners: [[0.42, 0.3], [0.58, 0.3], [0.58, 0.338], [0.42, 0.338]],
  text: 'YOUR BRAND HERE',
  theme: 'amber',
  speed: 9,
  opacity: 1,
});

const cloneOf = (b: Board): Board => ({
  ...b,
  corners: b.corners.map(([x, y]) => [Math.min(0.98, x + 0.03), Math.min(0.98, y + 0.03)]) as [number, number][],
});

const imgCache = new Map<string, HTMLImageElement>();
function loadImg(src: string): HTMLImageElement {
  const hit = imgCache.get(src);
  if (hit) return hit;
  const img = new Image();
  img.src = src;
  imgCache.set(src, img);
  return img;
}

let scratch: HTMLCanvasElement | null = null;
function scratchFor(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== w || scratch.height !== h) {
    scratch.width = w;
    scratch.height = h;
  }
  const ctx = scratch.getContext('2d');
  return ctx ? { canvas: scratch, ctx } : null;
}

/** Ray-cast point-in-polygon over a quad given in canvas px. */
function inQuad(px: number[][], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = 3; i < 4; j = i++) {
    const [xi, yi] = px[i];
    const [xj, yj] = px[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function drawBoard(ctx: CanvasRenderingContext2D, b: Board, now: number): void {
  const pts = b.corners.map(([x, y]) => [x * CW, y * CH]);
  ctx.save();
  ctx.globalAlpha = b.opacity ?? 1;
  if (b.kind === BillboardKind.Image && b.src) {
    const img = loadImg(b.src);
    if (img.complete && img.naturalWidth) drawImageQuad(ctx, img, img.naturalWidth, img.naturalHeight, pts);
  } else if (b.kind === BillboardKind.Led) {
    const topW = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
    const leftH = Math.hypot(pts[3][0] - pts[0][0], pts[3][1] - pts[0][1]);
    const ow = Math.max(16, Math.min(1024, Math.round(topW * 2)));
    const oh = Math.max(8, Math.min(256, Math.round(leftH * 2)));
    const scr = scratchFor(ow, oh);
    if (scr) {
      drawLedMarquee(scr.ctx, 0, 0, ow, oh, { text: b.text ?? '', theme: LED_THEMES[b.theme ?? 'amber'], speed: b.speed ?? 9 }, now);
      drawImageQuad(ctx, scr.canvas, ow, oh, pts);
    }
  }
  ctx.restore();
}

function Slider({ label, value, min, max, step, on }: { label: string; value: number; min: number; max: number; step: number; on: (v: number) => void }) {
  return (
    <label className="block">
      <div className="mb-0.5 flex justify-between text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums text-slate-200">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(+e.target.value)} className="w-full" />
    </label>
  );
}

const cloneBoards = (list: Billboard[]): Board[] =>
  (list as Board[]).map((b) => ({ ...b, corners: b.corners.map((c) => [...c]) as [number, number][] }));

/** Dev tool: draw/drag advertiser panels (image + LED) over the real pitch, then export the field-ratios.
 *  `courtSrc`/`initial`/`storageKey` retune another stadium's boards (auto-saved per court). */
export function BillboardEditor({ courtSrc = COURT_SRC, storageKey, initial }: { courtSrc?: string; storageKey?: string; initial?: Billboard[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const seed = initial ?? BILLBOARDS;
  const [boards, setBoards] = useState<Board[]>(() => cloneBoards(seed));
  const [sel, setSel] = useState(0);
  const boardsRef = useRef(boards);
  const selRef = useRef(sel);
  const drag = useRef<{ mode: 'corner' | 'move'; corner: number; startX: number; startY: number; base: [number, number][] } | null>(null);
  const court = useRef<HTMLImageElement | null>(null);
  const clip = useRef<Board | null>(null);

  // Mirror the latest state into refs so the (once-started) RAF loop reads it without re-subscribing.
  useEffect(() => {
    boardsRef.current = boards;
  }, [boards]);
  useEffect(() => {
    selRef.current = sel;
  }, [sel]);

  useEffect(() => {
    court.current = Object.assign(new Image(), { src: courtSrc });
  }, [courtSrc]);

  // Per-court session: restore the auto-saved boards once, then persist every change.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setBoards(JSON.parse(raw) as Board[]);
    } catch {
      // Corrupt/blocked storage — keep the seed.
    }
  }, [storageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(boards));
  }, [boards, storageKey]);

  // Single RAF loop (LED boards animate); reads the latest boards/sel from refs.
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      const ctx = ref.current?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.clearRect(0, 0, CW, CH);
        const c = court.current;
        if (c && c.complete && c.naturalWidth) ctx.drawImage(c, 0, 0, CW, CH);
        else {
          ctx.fillStyle = '#356a3a';
          ctx.fillRect(0, 0, CW, CH);
        }
        boardsRef.current.forEach((b) => drawBoard(ctx, b, t));
        // Selection: outline + corner handles.
        const s = boardsRef.current[selRef.current];
        if (s) {
          const px = s.corners.map(([x, y]) => [x * CW, y * CH]);
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          px.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
          ctx.closePath();
          ctx.stroke();
          ctx.setLineDash([]);
          px.forEach((p, i) => {
            ctx.fillStyle = ['#f97316', '#22c55e', '#eab308', '#ec4899'][i];
            ctx.fillRect(p[0] - 4, p[1] - 4, 8, 8);
          });
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Ctrl+C / Ctrl+V duplicate the selected board; arrow keys nudge it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && boards[sel]) clip.current = boards[sel];
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clip.current) {
        const c = clip.current;
        setBoards((a) => [...a, cloneOf(c)]);
        setSel(boards.length);
        e.preventDefault();
      } else if (e.key.startsWith('Arrow') && boards[sel]) {
        const dx = (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * (e.shiftKey ? 0.02 : 0.004);
        const dy = (e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0) * (e.shiftKey ? 0.02 : 0.004);
        setBoards((a) => a.map((b, i) => (i === sel ? { ...b, corners: b.corners.map(([x, y]) => [x + dx, y + dy]) as [number, number][] } : b)));
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [boards, sel]);

  const pos = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * CW, y: ((e.clientY - rect.top) / rect.height) * CH };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pos(e);
    ref.current?.setPointerCapture(e.pointerId);
    // 1) A corner handle of the selected board?
    const s = boards[sel];
    if (s) {
      for (let i = 0; i < 4; i++) {
        const cx = s.corners[i][0] * CW;
        const cy = s.corners[i][1] * CH;
        if ((cx - p.x) ** 2 + (cy - p.y) ** 2 < 12 * 12) {
          drag.current = { mode: 'corner', corner: i, startX: p.x, startY: p.y, base: s.corners.map((c) => [...c]) as [number, number][] };
          return;
        }
      }
    }
    // 2) Otherwise pick the board under the cursor and move it whole.
    for (let i = boards.length - 1; i >= 0; i--) {
      const px = boards[i].corners.map(([x, y]) => [x * CW, y * CH]);
      if (inQuad(px, p.x, p.y)) {
        setSel(i);
        drag.current = { mode: 'move', corner: -1, startX: p.x, startY: p.y, base: boards[i].corners.map((c) => [...c]) as [number, number][] };
        return;
      }
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = pos(e);
    const dx = (p.x - d.startX) / CW;
    const dy = (p.y - d.startY) / CH;
    setBoards((arr) =>
      arr.map((b, i) => {
        if (i !== selRef.current) return b;
        if (d.mode === 'corner') {
          const corners = b.corners.map((c, k) => (k === d.corner ? [d.base[k][0] + dx, d.base[k][1] + dy] : c)) as [number, number][];
          return { ...b, corners };
        }
        return { ...b, corners: d.base.map(([x, y]) => [x + dx, y + dy]) as [number, number][] };
      }),
    );
  };

  const patch = (p: Partial<Board>) => setBoards((arr) => arr.map((b, i) => (i === sel ? { ...b, ...p } : b)));
  const cur = boards[sel];

  const fmt = (b: Board) => {
    const c = b.corners.map(([x, y]) => `[${x.toFixed(3)}, ${y.toFixed(3)}]`).join(', ');
    if (b.kind === BillboardKind.Image) return `  { kind: BillboardKind.Image, corners: [${c}], src: '${b.src ?? ''}'${b.opacity != null && b.opacity !== 1 ? `, opacity: ${b.opacity}` : ''} },`;
    return `  { kind: BillboardKind.Led, corners: [${c}], text: '${(b.text ?? '').replace(/'/g, "\\'")}', theme: '${b.theme ?? 'amber'}', speed: ${b.speed ?? 9}${b.opacity != null && b.opacity !== 1 ? `, opacity: ${b.opacity}` : ''} },`;
  };
  const source = `// field-ratios of world.size; corners = TL, TR, BR, BL
// Default court → billboards.ts BILLBOARDS. Custom court → that config's \`billboards\` array
// (e.g. FRANCE_BILLBOARDS in realgk/config.ts).
[
${boards.map(fmt).join('\n')}
]`;

  const resetAll = () => {
    setBoards(cloneBoards(seed));
    setSel(0);
    if (storageKey) localStorage.removeItem(storageKey);
  };

  return (
    <div className="flex h-screen text-slate-100">
      <div className="flex-1 overflow-auto p-5">
        <h1 className="text-lg font-semibold">Billboard editor — advertiser panels</h1>
        <p className="mt-1 text-sm text-slate-400">
          Drag a board to move it; drag its <b>colored corners</b> to warp the perspective (TL·TR·BR·BL). Arrow keys nudge (Shift = bigger),
          <b> Ctrl+C/V</b> duplicates. Pick <b>image</b> or <b>LED</b> on the right, then Copy the field-ratios into <code>billboards.ts</code>.
        </p>
        <canvas
          ref={ref}
          width={CW}
          height={CH}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => (drag.current = null)}
          className="mt-4 w-full rounded-lg border border-slate-700"
          style={{ touchAction: 'none', cursor: 'move' }}
        />
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">export → BILLBOARDS</h2>
            <button onClick={() => navigator.clipboard?.writeText(source)} className="rounded bg-sky-600 px-2.5 py-1 text-xs font-medium">
              Copy
            </button>
          </div>
          <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-950 p-3 text-[11px] leading-relaxed text-emerald-300">{source}</pre>
        </div>
      </div>

      <aside className="w-[320px] shrink-0 space-y-4 overflow-auto border-l border-slate-700 bg-slate-900/60 p-4 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">Boards ({boards.length})</h3>
          <button onClick={resetAll} className="rounded bg-slate-700 px-2 py-0.5" title="Back to this court's checked-in placements (clears the auto-saved session)">
            reset
          </button>
          <button
            onClick={() => {
              setBoards((a) => [...a, cloneOf(a[sel] ?? newBoard())]);
              setSel(boards.length);
            }}
            className="rounded bg-slate-700 px-2 py-0.5"
          >
            + add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {boards.map((b, i) => (
            <button key={i} onClick={() => setSel(i)} className={`rounded px-2 py-0.5 ${sel === i ? 'bg-sky-500 text-black' : 'bg-slate-700'}`}>
              {i + 1}
              <span className="ml-1 opacity-60">{b.kind === BillboardKind.Led ? 'LED' : 'IMG'}</span>
            </button>
          ))}
        </div>

        {cur ? (
          <div className="space-y-3">
            <div className="flex gap-1">
              {[BillboardKind.Led, BillboardKind.Image].map((k) => (
                <button key={k} onClick={() => patch({ kind: k })} className={`flex-1 rounded px-2 py-1 ${cur.kind === k ? 'bg-emerald-600 text-black' : 'bg-slate-700'}`}>
                  {k === BillboardKind.Led ? 'LED board' : 'Image'}
                </button>
              ))}
            </div>

            {cur.kind === BillboardKind.Led ? (
              <div className="space-y-2">
                <label className="block">
                  <span className="text-slate-400">Text</span>
                  <input value={cur.text ?? ''} onChange={(e) => patch({ text: e.target.value })} className="mt-1 w-full rounded bg-slate-800 px-2 py-1 text-slate-100" />
                </label>
                <label className="block">
                  <span className="text-slate-400">Palette</span>
                  <select value={cur.theme ?? 'amber'} onChange={(e) => patch({ theme: e.target.value as keyof typeof LED_THEMES })} className="mt-1 w-full rounded bg-slate-800 px-2 py-1 capitalize text-slate-100">
                    {THEME_KEYS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <Slider label="Speed" value={cur.speed ?? 9} min={0} max={30} step={1} on={(v) => patch({ speed: v })} />
                <div className="rounded border border-slate-700 bg-black/40 p-2">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Live preview (&lt;LightBoard&gt;)</div>
                  <LightBoard text={cur.text ?? ''} theme={cur.theme ?? 'amber'} speed={cur.speed ?? 9} height={34} />
                </div>
              </div>
            ) : (
              <label className="block">
                <span className="text-slate-400">Ad image</span>
                <select value={cur.src ?? AD_IMAGES[0]} onChange={(e) => patch({ src: e.target.value })} className="mt-1 w-full rounded bg-slate-800 px-2 py-1 text-slate-100">
                  {AD_IMAGES.map((s) => (
                    <option key={s} value={s}>{s.split('/').pop()}</option>
                  ))}
                </select>
              </label>
            )}

            <Slider label="Opacity" value={cur.opacity ?? 1} min={0.2} max={1} step={0.05} on={(v) => patch({ opacity: v })} />

            <button
              onClick={() => {
                setBoards((a) => (a.length <= 1 ? a : a.filter((_, i) => i !== sel)));
                setSel(0);
              }}
              disabled={boards.length <= 1}
              className="w-full rounded bg-rose-700 px-2 py-1 disabled:opacity-40"
            >
              Remove this board
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
