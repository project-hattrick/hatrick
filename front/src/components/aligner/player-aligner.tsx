'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignConfig,
  BASE_VISIBLE_HEIGHT,
  Bbox,
  FrameCfg,
  HEAD_OPTIONS,
  PLAYER_ANIMS,
  STORAGE_KEY,
  bodyPath,
  freshConfig,
  headPath,
} from './player-aligner-data';

const CANVAS_W = 900;
const CANVAS_H = 620;
const FLOOR = 0.84;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface Rect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/** Imperative editor scratch state — only touched inside effects / event handlers, never during render. */
interface Ed {
  bboxes: Record<string, Bbox[]>;
  bodies: Record<string, HTMLImageElement>;
  heads: Record<string, HTMLImageElement>;
  panX: number;
  panY: number;
  dragging: boolean;
  panning: boolean;
  spacePressed: boolean;
  panStartX: number;
  panStartY: number;
  startPanX: number;
  startPanY: number;
  dragStartX: number;
  dragStartY: number;
  startOffX: number;
  startOffY: number;
  bodyRect: (Rect & { l: number; t: number; sw: number; sh: number }) | null;
  headRect: Rect | null;
}

const makeEd = (): Ed => ({
  bboxes: {},
  bodies: {},
  heads: {},
  panX: 0,
  panY: 0,
  dragging: false,
  panning: false,
  spacePressed: false,
  panStartX: 0,
  panStartY: 0,
  startPanX: 0,
  startPanY: 0,
  dragStartX: 0,
  dragStartY: 0,
  startOffX: 0,
  startOffY: 0,
  bodyRect: null,
  headRect: null,
});

/** Scans a sheet quadrant's alpha for the tight body bounds (2x2 sheets ship no bboxes). */
function trimBbox(img: HTMLImageElement, sx: number, sy: number, sw: number, sh: number): Bbox {
  const c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const cx = c.getContext('2d');
  if (!cx) return [sx, sy, sx + sw, sy + sh];
  cx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  let data: Uint8ClampedArray;
  try {
    data = cx.getImageData(0, 0, sw, sh).data;
  } catch {
    return [sx, sy, sx + sw, sy + sh];
  }
  let minX = sw;
  let minY = sh;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (data[(y * sw + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return [sx, sy, sx + sw, sy + sh];
  return [sx + minX, sy + minY, sx + maxX + 1, sy + maxY + 1];
}

function mergeSaved(config: AlignConfig, saved: unknown): void {
  if (!saved || typeof saved !== 'object') return;
  for (const [key, value] of Object.entries(saved as Record<string, unknown>)) {
    if (!config[key] || !Array.isArray(value)) continue;
    value.forEach((frame, i) => {
      if (config[key][i] && frame && typeof frame === 'object') Object.assign(config[key][i], frame);
    });
  }
}

const SELECT = 'h-9 rounded-md border border-border/60 bg-surface-1/80 px-2 text-xs font-bold';
const BTN = 'h-9 rounded-md border border-border/60 bg-surface-1/80 px-3 text-xs font-bold uppercase tracking-wide hover:bg-surface-2';

/** In-app player head aligner — composites a separate head onto headless body frames at hero scale. */
export function PlayerAligner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const edRef = useRef<Ed>(makeEd());
  const savedOnce = useRef(false);

  const [config, setConfig] = useState<AlignConfig>(() => {
    const base = freshConfig();
    if (typeof window !== 'undefined') {
      try {
        mergeSaved(base, JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
      } catch {
        /* ignore */
      }
    }
    return base;
  });
  const [animId, setAnimId] = useState(PLAYER_ANIMS[0].id);
  const [frameIndex, setFrameIndex] = useState(0);
  const [mirror, setMirror] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [zoom, setZoom] = useState(2.4);
  const [loaded, setLoaded] = useState(false);

  const anim = PLAYER_ANIMS.find((a) => a.id === animId) ?? PLAYER_ANIMS[0];
  const c = config[animId][frameIndex];

  const updateFrame = useCallback(
    (updater: (f: FrameCfg) => FrameCfg) => {
      setConfig((prev) => ({ ...prev, [animId]: prev[animId].map((f, i) => (i === frameIndex ? updater(f) : f)) }));
    },
    [animId, frameIndex],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ed = edRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(zoom, 0, 0, zoom, ed.panX, ed.panY);

    const frame = config[animId][frameIndex];
    const floorY = canvas.height * FLOOR;
    if (showGuides) {
      ctx.save();
      ctx.strokeStyle = 'rgba(241, 215, 114, 0.5)';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([8 / zoom, 8 / zoom]);
      ctx.beginPath();
      ctx.moveTo(0, floorY + 0.5);
      ctx.lineTo(canvas.width, floorY + 0.5);
      ctx.stroke();
      ctx.restore();
    }

    const bbox = ed.bboxes[animId]?.[frameIndex];
    const body = ed.bodies[animId];
    ed.bodyRect = null;
    ed.headRect = null;
    if (bbox && body?.complete && body.naturalWidth) {
      const [l, t, r, b] = bbox;
      const sw = Math.max(1, r - l);
      const sh = Math.max(1, b - t);
      const dh = BASE_VISIBLE_HEIGHT * frame.bodyScale;
      const dw = sw * (dh / sh);
      const dx = canvas.width * 0.5 - dw * 0.5;
      const dy = floorY - dh;
      ed.bodyRect = { l, t, sw, sh, dx, dy, dw, dh };
      if (mirror) {
        ctx.save();
        ctx.translate(dx + dw, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(body, l, t, sw, sh, 0, dy, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(body, l, t, sw, sh, dx, dy, dw, dh);
      }

      const head = ed.heads[frame.headView];
      if (head?.complete && head.naturalWidth) {
        const hh = dh * frame.headScale;
        const hw = head.naturalWidth * (hh / head.naturalHeight);
        const shiftX = dw * frame.offsetXRatio * (mirror ? -1 : 1);
        const hx = canvas.width * 0.5 - hw * 0.5 + shiftX;
        const hy = dy - hh + dh * frame.offsetYRatio;
        ed.headRect = { dx: hx, dy: hy, dw: hw, dh: hh };
        if (mirror && frame.headView.startsWith('side')) {
          ctx.save();
          ctx.translate(hx + hw, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(head, 0, hy, hw, hh);
          ctx.restore();
        } else {
          ctx.drawImage(head, hx, hy, hw, hh);
        }
      }
    }

    if (showGuides && ed.bodyRect) {
      ctx.lineWidth = 1.5 / zoom;
      ctx.strokeStyle = 'rgba(121, 239, 193, 0.9)';
      ctx.strokeRect(ed.bodyRect.dx + 0.5, ed.bodyRect.dy + 0.5, ed.bodyRect.dw, ed.bodyRect.dh);
      if (ed.headRect) {
        ctx.strokeStyle = 'rgba(241, 215, 114, 0.95)';
        ctx.strokeRect(ed.headRect.dx + 0.5, ed.headRect.dy + 0.5, ed.headRect.dw, ed.headRect.dh);
      }
    }
  }, [config, animId, frameIndex, mirror, showGuides, zoom]);

  useEffect(() => {
    const ed = edRef.current;
    HEAD_OPTIONS.forEach((h) => {
      const img = new Image();
      img.src = headPath(h.id);
      ed.heads[h.id] = img;
    });
    let alive = true;
    Promise.all(
      PLAYER_ANIMS.map(async (a) => {
        const img = new Image();
        img.src = bodyPath(a.body);
        ed.bodies[a.id] = img;
        try {
          await img.decode();
        } catch {
          /* ignore */
        }
        const w = img.naturalWidth || 2;
        const h = img.naturalHeight || 2;
        const hw = Math.floor(w / 2);
        const hh = Math.floor(h / 2);
        ed.bboxes[a.id] = Array.from({ length: a.frameCount }, (_, i) =>
          trimBbox(img, (i % 2) * hw, Math.floor(i / 2) * hh, hw, hh),
        );
      }),
    ).then(() => {
      if (alive) setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!savedOnce.current) {
      savedOnce.current = true;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    render();
  }, [render, loaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clamp(z + (e.deltaY < 0 ? 0.12 : -0.12), 1, 4));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        edRef.current.spacePressed = true;
        e.preventDefault();
        return;
      }
      if (e.key.toLowerCase() === 'g') {
        setShowGuides((s) => !s);
        return;
      }
      const step = e.shiftKey ? 0.03 : 0.01;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      updateFrame((f) => {
        let x = f.offsetXRatio;
        let y = f.offsetYRatio;
        if (e.key === 'ArrowLeft') x -= mirror ? -step : step;
        else if (e.key === 'ArrowRight') x += mirror ? -step : step;
        else if (e.key === 'ArrowUp') y -= step;
        else y += step;
        return { ...f, offsetXRatio: clamp(x, -0.5, 0.5), offsetYRatio: clamp(y, -0.3, 0.4) };
      });
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') edRef.current.spacePressed = false;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onUp);
    };
  }, [mirror, updateFrame]);

  const canvasPoint = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const ed = edRef.current;
    const p = canvasPoint(e);
    if (ed.spacePressed || e.button === 1) {
      ed.panning = true;
      ed.panStartX = p.x;
      ed.panStartY = p.y;
      ed.startPanX = ed.panX;
      ed.startPanY = ed.panY;
      canvasRef.current!.setPointerCapture(e.pointerId);
      return;
    }
    const hr = ed.headRect;
    if (!hr) return;
    const wx = (p.x - ed.panX) / zoom;
    const wy = (p.y - ed.panY) / zoom;
    const pad = 18 / zoom;
    if (wx >= hr.dx - pad && wx <= hr.dx + hr.dw + pad && wy >= hr.dy - pad && wy <= hr.dy + hr.dh + pad) {
      ed.dragging = true;
      ed.dragStartX = wx;
      ed.dragStartY = wy;
      ed.startOffX = c.offsetXRatio;
      ed.startOffY = c.offsetYRatio;
      canvasRef.current!.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const ed = edRef.current;
    const p = canvasPoint(e);
    if (ed.panning) {
      ed.panX = ed.startPanX + (p.x - ed.panStartX);
      ed.panY = ed.startPanY + (p.y - ed.panStartY);
      render();
      return;
    }
    if (!ed.dragging || !ed.bodyRect) return;
    const wx = (p.x - ed.panX) / zoom;
    const wy = (p.y - ed.panY) / zoom;
    const bw = ed.bodyRect.dw;
    const bh = ed.bodyRect.dh;
    updateFrame((f) => ({
      ...f,
      offsetXRatio: clamp(ed.startOffX + ((wx - ed.dragStartX) / bw) * (mirror ? -1 : 1), -0.5, 0.5),
      offsetYRatio: clamp(ed.startOffY + (wy - ed.dragStartY) / bh, -0.3, 0.4),
    }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const ed = edRef.current;
    ed.dragging = false;
    ed.panning = false;
    try {
      canvasRef.current!.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const resetFrame = () => updateFrame(() => ({ ...anim.defaults }));
  const resetAll = () => setConfig(freshConfig());
  const copyJson = () => navigator.clipboard.writeText(JSON.stringify(config, null, 2)).catch(() => {});

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Player Head Aligner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Headless body + separate head at the hero base scale. Drag the head, scroll to zoom, <b>Space+drag</b> pans,
            arrows nudge, <b>G</b> toggles guides. Each frame keeps its own values.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select className={SELECT} value={animId} onChange={(e) => { setAnimId(e.target.value); setFrameIndex(0); }}>
            {PLAYER_ANIMS.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
          <select className={SELECT} value={frameIndex} onChange={(e) => setFrameIndex(Number(e.target.value))}>
            {Array.from({ length: anim.frameCount }, (_, i) => (
              <option key={i} value={i}>Frame {String(i + 1).padStart(2, '0')}</option>
            ))}
          </select>
          <select className={SELECT} value={c.headView} onChange={(e) => updateFrame((f) => ({ ...f, headView: e.target.value }))}>
            {HEAD_OPTIONS.map((h) => (
              <option key={h.id} value={h.id}>{h.label}</option>
            ))}
          </select>
          <select className={SELECT} value={mirror ? '1' : '0'} onChange={(e) => setMirror(e.target.value === '1')}>
            <option value="0">Right</option>
            <option value="1">Left</option>
          </select>
          <button className={BTN} onClick={() => setShowGuides((s) => !s)}>{showGuides ? 'Hide guides' : 'Show guides'}</button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/60 bg-surface-1">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="block w-full cursor-grab"
            style={{ imageRendering: 'pixelated', aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
          />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {anim.id} · frame {frameIndex + 1}/{anim.frameCount} · base {BASE_VISIBLE_HEIGHT}px · zoom {zoom.toFixed(1)}x · offX{' '}
          {c.offsetXRatio.toFixed(2)} · offY {c.offsetYRatio.toFixed(2)}
        </p>
      </section>

      <aside className="flex flex-col gap-3">
        <Slider label="Zoom" min={1} max={4} step={0.1} value={zoom} onChange={setZoom} fmt={(v) => v.toFixed(1) + 'x'} />
        <Slider label="Body scale" min={0.5} max={1.6} step={0.01} value={c.bodyScale} onChange={(v) => updateFrame((f) => ({ ...f, bodyScale: v }))} />
        <Slider label="Head scale" min={0.18} max={0.9} step={0.01} value={c.headScale} onChange={(v) => updateFrame((f) => ({ ...f, headScale: v }))} />
        <Slider label="Offset X" min={-0.5} max={0.5} step={0.01} value={c.offsetXRatio} onChange={(v) => updateFrame((f) => ({ ...f, offsetXRatio: v }))} />
        <Slider label="Offset Y" min={-0.3} max={0.4} step={0.01} value={c.offsetYRatio} onChange={(v) => updateFrame((f) => ({ ...f, offsetYRatio: v }))} />

        <div className="flex flex-wrap gap-2">
          <button className={BTN} onClick={() => setFrameIndex((f) => (f + anim.frameCount - 1) % anim.frameCount)}>Frame -</button>
          <button className={BTN} onClick={() => setFrameIndex((f) => (f + 1) % anim.frameCount)}>Frame +</button>
          <button className={BTN} onClick={resetFrame}>Reset frame</button>
          <button className={BTN} onClick={resetAll}>Reset all</button>
          <button className={BTN} onClick={copyJson}>Copy JSON</button>
        </div>

        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted-foreground">
          JSON
          <textarea readOnly spellCheck={false} value={JSON.stringify(config, null, 2)} className="h-64 rounded-md border border-border/60 bg-surface-1/80 p-2 font-mono text-[11px] leading-relaxed" />
        </label>
      </aside>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  fmt,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted-foreground">
      <span className="flex items-center justify-between">
        {label}
        <span className="text-neon">{fmt ? fmt(value) : value.toFixed(2)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
