'use client';

import { useEffect, useRef, useState } from 'react';
import { fieldBounds, pointOnField } from '@/game/realgk/field';
import {
  COURT_BG,
  IDLE_FRAMES,
  IDLE_FRAME_MS,
  IDLE_HEAD_CFG,
  PERSONAS,
  SPRITE_MAX_H,
  SPRITE_MIN_H,
  type Persona,
} from './idle-regen-data';

type ImageMap = Record<string, HTMLImageElement>;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Body height at `depth`, matching the engine's `normalizedSizes` rule: the base actor height is
 * divided so body + composited head together read as the target size we use for outfield players.
 */
function bodyHeightFor(depth: number, scale: number): number {
  const base = lerp(SPRITE_MIN_H, SPRITE_MAX_H, depth);
  const divisor = Math.max(0.75, 1 + IDLE_HEAD_CFG.headScale - IDLE_HEAD_CFG.offsetYRatio);
  return (base / divisor) * scale;
}

/** Composite one persona (regen body frame + front head), foot-anchored at (footX, footY). */
function drawActor(
  ctx: CanvasRenderingContext2D,
  frame: HTMLImageElement,
  head: HTMLImageElement,
  footX: number,
  footY: number,
  bodyHeight: number,
): void {
  if (!frame.complete || !frame.naturalWidth || !head.complete || !head.naturalWidth) return;
  const bodyW = frame.naturalWidth * (bodyHeight / frame.naturalHeight);
  const bodyX = Math.round(footX - bodyW * 0.5);
  const bodyY = Math.round(footY - bodyHeight);
  ctx.drawImage(frame, bodyX, bodyY, bodyW, bodyHeight);

  const headH = bodyHeight * IDLE_HEAD_CFG.headScale;
  const headW = head.naturalWidth * (headH / head.naturalHeight);
  const headX = Math.round(footX - headW * 0.5 + bodyW * IDLE_HEAD_CFG.offsetXRatio);
  const headY = Math.round(bodyY - headH + bodyHeight * IDLE_HEAD_CFG.offsetYRatio);
  ctx.drawImage(head, headX, headY, headW, headH);
}

/** Soft ground shadow under the actor, sized by pitch depth (mirrors the engine's foot shadow). */
function drawShadow(ctx: CanvasRenderingContext2D, footX: number, footY: number, depth: number): void {
  const rx = lerp(6.5, 12, depth);
  const ry = lerp(2.5, 4.8, depth);
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(footX, footY + 3, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function IdleRegenPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<{ court: HTMLImageElement | null; frames: ImageMap; heads: ImageMap }>({
    court: null,
    frames: {},
    heads: {},
  });
  const stateRef = useRef({ scale: 1, labels: true });
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(1);
  const [labels, setLabels] = useState(true);

  useEffect(() => {
    stateRef.current.scale = scale;
    stateRef.current.labels = labels;
  }, [scale, labels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let cancelled = false;
    let last = performance.now();
    let elapsed = 0;
    let frameIndex = 0;
    let size = { width: 1, height: 1 };
    let dpr = 1;

    function resize(): void {
      if (!canvas) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      size = { width: w, height: h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    (async () => {
      const [court] = await Promise.all([loadImage(COURT_BG)]);
      const frames: ImageMap = {};
      const heads: ImageMap = {};
      const jobs: Promise<void>[] = [];
      for (const src of IDLE_FRAMES) jobs.push(loadImage(src).then((img) => void (frames[src] = img)));
      for (const p of PERSONAS) jobs.push(loadImage(p.head).then((img) => void (heads[p.id] = img)));
      await Promise.all(jobs);
      if (cancelled) return;
      imagesRef.current = { court, frames, heads };
      resize();
      setReady(true);
      last = performance.now();
      raf = requestAnimationFrame(loop);
    })();

    function loop(now: number): void {
      const dt = Math.min(50, now - last);
      last = now;
      elapsed += dt;
      if (elapsed >= IDLE_FRAME_MS) {
        elapsed = 0;
        frameIndex = (frameIndex + 1) % IDLE_FRAMES.length;
      }

      const { court, frames, heads } = imagesRef.current;
      if (!ctx || !canvas) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, size.width, size.height);
      if (court?.complete && court.naturalWidth) {
        ctx.drawImage(court, 0, 0, size.width, size.height);
      }

      ctx.imageSmoothingEnabled = false;
      const frame = frames[IDLE_FRAMES[frameIndex]];
      const t = now / 1000;

      // Depth-sort so nearer actors overlap farther ones, like the engine's render.
      const drawList = PERSONAS.map((persona, i) => {
        const sway = Math.sin(t * 1.1 + i * 1.7) * 0.006;
        const bob = Math.sin(t * 1.4 + i) * 0.004;
        const foot = pointOnField(size, persona.lat + sway, persona.depth + bob);
        const depth = fieldBounds(size, foot.y).depth;
        return { persona, foot, depth };
      }).sort((a, b) => a.foot.y - b.foot.y);

      for (const { persona, foot, depth } of drawList) {
        const head = heads[persona.id];
        if (!frame || !head) continue;
        drawShadow(ctx, foot.x, foot.y, depth);
        drawActor(ctx, frame, head, foot.x, foot.y, bodyHeightFor(depth, stateRef.current.scale));
        if (stateRef.current.labels) drawLabel(ctx, persona, foot.x, foot.y, depth);
      }
      raf = requestAnimationFrame(loop);
    }

    function drawLabel(ctx: CanvasRenderingContext2D, persona: Persona, footX: number, footY: number, depth: number): void {
      const top = footY - bodyHeightFor(depth, stateRef.current.scale) * (1 + IDLE_HEAD_CFG.headScale) - 8;
      ctx.save();
      ctx.font = '700 11px Consolas, "Courier New", monospace';
      ctx.textAlign = 'center';
      const w = ctx.measureText(persona.label).width + 14;
      ctx.fillStyle = 'rgba(8, 18, 28, 0.82)';
      ctx.fillRect(footX - w / 2, top - 14, w, 18);
      ctx.strokeStyle = persona.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(footX - w / 2, top - 14, w, 18);
      ctx.fillStyle = '#eef7ff';
      ctx.fillText(persona.label, footX, top - 1);
      ctx.restore();
    }

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#06222f]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />

      {!ready && (
        <div className="absolute inset-0 grid place-items-center font-mono text-xs uppercase text-white/70">
          Loading sprites…
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[46ch] rounded-md border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-sm">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-emerald-300">
          Regen idle · on-pitch
        </p>
        <h1 className="mt-1 text-lg font-bold uppercase leading-none text-white">New body idle, three heads</h1>
        <p className="mt-1.5 text-[12px] leading-snug text-white/70">
          The regen body-only idle composited with each persona head, dropped onto our match court at our
          usual outfield player size.
        </p>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-md border border-white/15 bg-black/60 px-4 py-2.5 backdrop-blur-sm">
        <span className="font-mono text-[11px] font-bold uppercase text-white/60">Size</span>
        <input
          type="range"
          min={0.6}
          max={2}
          step={0.05}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="w-40 accent-emerald-400"
        />
        <span className="w-12 text-right font-mono text-[11px] font-bold text-white/70">{scale.toFixed(2)}×</span>
        <button
          onClick={() => setLabels((v) => !v)}
          className={`min-h-8 border px-3 py-1.5 text-[11px] font-bold uppercase ${
            labels ? 'border-emerald-400/60 bg-white/10 text-emerald-300' : 'border-white/20 bg-transparent text-white/70'
          }`}
        >
          Labels
        </button>
        <button
          onClick={() => {
            setScale(1);
            setLabels(true);
          }}
          className="min-h-8 border border-white/20 px-3 py-1.5 text-[11px] font-bold uppercase text-white/70"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
