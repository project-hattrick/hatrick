'use client';

import { useEffect, useRef, useState } from 'react';

const CW = 900;
const CH = 520;
const COURT_SRC = '/game/stadiums/rain-court/court.png';

/** A placeable court shadow (soft, blurred parallelogram) in canvas px. */
interface Shadow {
  x: number;
  y: number;
  w: number;
  h: number;
  skew: number;
  alpha: number;
  blur: number;
}

const newShadow = (): Shadow => ({ x: CW / 2, y: CH / 2, w: 110, h: 280, skew: -260, alpha: 0.22, blur: 8 });
/** A copy nudged down-right, so a new/pasted shadow accumulates next to the source (last stays put). */
const cloneOf = (s: Shadow): Shadow => ({ ...s, x: Math.min(CW - 20, s.x + 28), y: Math.min(CH - 20, s.y + 22) });

function drawShadow(ctx: CanvasRenderingContext2D, s: Shadow, blur: boolean) {
  const topY = s.y - s.h / 2;
  const botY = s.y + s.h / 2;
  ctx.save();
  ctx.globalAlpha = s.alpha;
  ctx.fillStyle = '#0a1030';
  if (blur) ctx.filter = `blur(${s.blur}px)`;
  ctx.beginPath();
  ctx.moveTo(s.x - s.w / 2 + s.skew / 2, topY);
  ctx.lineTo(s.x + s.w / 2 + s.skew / 2, topY);
  ctx.lineTo(s.x + s.w / 2 - s.skew / 2, botY);
  ctx.lineTo(s.x - s.w / 2 - s.skew / 2, botY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, court: HTMLImageElement | null, shadows: Shadow[], sel: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, CW, CH);
  if (court && court.complete && court.naturalWidth) {
    ctx.drawImage(court, 0, 0, CW, CH);
  } else {
    for (let x = 0; x < CW; x += 28) {
      ctx.fillStyle = '#3a9c44';
      ctx.fillRect(x, 0, 14, CH);
      ctx.fillStyle = '#33903c';
      ctx.fillRect(x + 14, 0, 14, CH);
    }
  }
  shadows.forEach((s) => drawShadow(ctx, s, true));
  // Selection outline (crisp, no blur).
  const s = shadows[sel];
  if (s) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(s.x - s.w / 2 + s.skew / 2, s.y - s.h / 2);
    ctx.lineTo(s.x + s.w / 2 + s.skew / 2, s.y - s.h / 2);
    ctx.lineTo(s.x + s.w / 2 - s.skew / 2, s.y + s.h / 2);
    ctx.lineTo(s.x - s.w / 2 - s.skew / 2, s.y + s.h / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(s.x - 3, s.y - 3, 6, 6); // center handle
    ctx.restore();
  }
}

function Slider({ label, value, min, max, step, on }: { label: string; value: number; min: number; max: number; step: number; on: (v: number) => void }) {
  return (
    <label className="block">
      <div className="mb-0.5 flex justify-between text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums text-slate-200">{value.toFixed(value < 3 ? 3 : 0)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(+e.target.value)} className="w-full" />
    </label>
  );
}

/** Dev tool: place / drag / resize court shadows over the real pitch, then export the field-ratio list. */
export function ShadowEditor() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [shadows, setShadows] = useState<Shadow[]>([newShadow()]);
  const [sel, setSel] = useState(0);
  const [court] = useState<HTMLImageElement | null>(() => (typeof window === 'undefined' ? null : Object.assign(new Image(), { src: COURT_SRC })));
  const [ready, setReady] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const clip = useRef<Shadow | null>(null);

  useEffect(() => {
    court
      ?.decode()
      .catch(() => null)
      .finally(() => setReady(true));
  }, [court]);

  // Ctrl/Cmd + C copies the selected shadow; Ctrl/Cmd + V pastes it as a new accumulated layer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'c' && shadows[sel]) {
        clip.current = { ...shadows[sel] };
      } else if (k === 'v' && clip.current) {
        const c = clip.current;
        setShadows((a) => [...a, cloneOf(c)]);
        setSel(shadows.length);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shadows, sel]);

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (ctx) draw(ctx, court, shadows, sel);
  }, [shadows, sel, court, ready]);

  const pos = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * CW, y: ((e.clientY - rect.top) / rect.height) * CH };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pos(e);
    ref.current?.setPointerCapture(e.pointerId);
    // Pick the nearest shadow center within a grab radius.
    let best = -1;
    let bestD = 60 * 60;
    shadows.forEach((s, i) => {
      const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) {
      setSel(best);
      drag.current = { dx: p.x - shadows[best].x, dy: p.y - shadows[best].y };
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const p = pos(e);
    const d = drag.current;
    setShadows((arr) => arr.map((s, i) => (i === sel ? { ...s, x: p.x - d.dx, y: p.y - d.dy } : s)));
  };

  const patch = (p: Partial<Shadow>) => setShadows((arr) => arr.map((s, i) => (i === sel ? { ...s, ...p } : s)));
  const cur = shadows[sel];

  const source = `// render.ts → drawShadowBeams: placed court shadows (field ratios of world.size)
const COURT_SHADOWS = [
${shadows
  .map((s) => `  { x: ${(s.x / CW).toFixed(3)}, y: ${(s.y / CH).toFixed(3)}, w: ${(s.w / CW).toFixed(3)}, h: ${(s.h / CH).toFixed(3)}, skew: ${(s.skew / CW).toFixed(3)}, alpha: ${s.alpha.toFixed(3)}, blur: ${s.blur} },`)
  .join('\n')}
];`;

  return (
    <div className="flex h-screen text-slate-100">
      <div className="flex-1 overflow-auto p-5">
        <h1 className="text-lg font-semibold">Court shadow editor</h1>
        <p className="mt-1 text-sm text-slate-400">Drag a shadow to position it on the real pitch. <b>+ add</b> (or <b>Ctrl+V</b>) duplicates the selected one so they accumulate; <b>Ctrl+C</b> copies it. Tune the selected on the right. Copy exports field-ratios for the engine.</p>
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
            <h2 className="text-sm font-semibold text-slate-300">export</h2>
            <button onClick={() => navigator.clipboard?.writeText(source)} className="rounded bg-sky-600 px-2.5 py-1 text-xs font-medium">
              Copy
            </button>
          </div>
          <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-950 p-3 text-[11px] leading-relaxed text-emerald-300">{source}</pre>
        </div>
      </div>

      <aside className="w-[300px] shrink-0 space-y-4 overflow-auto border-l border-slate-700 bg-slate-900/60 p-4 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">Shadows ({shadows.length})</h3>
          <button
            onClick={() => {
              setShadows((a) => [...a, cloneOf(a[sel] ?? a[a.length - 1] ?? newShadow())]);
              setSel(shadows.length);
            }}
            className="rounded bg-slate-700 px-2 py-0.5"
          >
            + add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {shadows.map((_, i) => (
            <button key={i} onClick={() => setSel(i)} className={`rounded px-2 py-0.5 ${sel === i ? 'bg-sky-500 text-black' : 'bg-slate-700'}`}>
              {i + 1}
            </button>
          ))}
        </div>

        {cur ? (
          <div className="space-y-2">
            <Slider label="Width" value={cur.w} min={20} max={400} step={2} on={(v) => patch({ w: v })} />
            <Slider label="Length" value={cur.h} min={20} max={CH} step={4} on={(v) => patch({ h: v })} />
            <Slider label="Skew" value={cur.skew} min={-600} max={600} step={5} on={(v) => patch({ skew: v })} />
            <Slider label="Alpha" value={cur.alpha} min={0} max={0.6} step={0.01} on={(v) => patch({ alpha: v })} />
            <Slider label="Blur" value={cur.blur} min={0} max={24} step={1} on={(v) => patch({ blur: v })} />
            <button
              onClick={() => {
                setShadows((a) => a.filter((_, i) => i !== sel));
                setSel(0);
              }}
              disabled={shadows.length <= 1}
              className="w-full rounded bg-rose-700 px-2 py-1 disabled:opacity-40"
            >
              Remove this shadow
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
