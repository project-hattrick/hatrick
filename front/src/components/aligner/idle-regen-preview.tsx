'use client';

import { useEffect, useRef, useState } from 'react';
import {
  IDLE_FRAME_CONFIG,
  IDLE_FRAME_MS,
  IDLE_FRAMES,
  IDLE_REGEN_STAGE_BG,
  PERSONAS,
  type FrameConfig,
  type Persona,
} from './idle-regen-data';

/** Square work canvas; sprite is drawn at true proportions inside it (no CSS stretch). */
const CANVAS_SIZE = 176;
/** Body height (px in canvas space) at bodyScale 1 — leaves room for the head overhang. */
const TARGET_SPRITE_HEIGHT = 122;
const BOTTOM_PADDING = 10;

type ImageMap = Record<string, HTMLImageElement>;

interface ActorNodes {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  wrap: HTMLDivElement | null;
  shadow: HTMLDivElement | null;
  label: HTMLDivElement | null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Composite one persona: regen body frame + front head, per the frame's tuned config. */
function drawActor(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: HTMLImageElement,
  head: HTMLImageElement,
  cfg: FrameConfig,
): void {
  const bodyW = frame.naturalWidth;
  const bodyH = frame.naturalHeight;
  const headH = bodyH * cfg.headScale;
  const headW = head.naturalWidth * (headH / head.naturalHeight);

  if (canvas.width !== CANVAS_SIZE || canvas.height !== CANVAS_SIZE) {
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    ctx.imageSmoothingEnabled = false;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fit the body to a stable on-canvas height so every frame reads the same size,
  // then bottom-anchor it and overlay the head using the per-frame offset ratios.
  const fitScale = TARGET_SPRITE_HEIGHT / Math.max(1, bodyH * cfg.bodyScale);
  const bodyDrawW = bodyW * cfg.bodyScale * fitScale;
  const bodyDrawH = bodyH * cfg.bodyScale * fitScale;
  const bodyX = canvas.width * 0.5 - bodyDrawW * 0.5;
  const bodyY = canvas.height - BOTTOM_PADDING - bodyDrawH;

  const headDrawH = headH * cfg.bodyScale * fitScale;
  const headDrawW = headW * cfg.bodyScale * fitScale;
  const headDrawX = bodyX + bodyDrawW * 0.5 - headDrawW * 0.5 + bodyDrawW * cfg.offsetXRatio;
  const headDrawY = bodyY - headDrawH + bodyDrawH * cfg.offsetYRatio;

  ctx.drawImage(frame, bodyX, bodyY, bodyDrawW, bodyDrawH);
  ctx.drawImage(head, headDrawX, headDrawY, headDrawW, headDrawH);
}

export function IdleRegenPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<ActorNodes[]>(
    PERSONAS.map(() => ({ canvas: null, ctx: null, wrap: null, shadow: null, label: null })),
  );
  const imagesRef = useRef<{ frames: ImageMap; heads: ImageMap }>({ frames: {}, heads: {} });
  const stateRef = useRef({ size: 128 });

  const [ready, setReady] = useState(false);
  const [labels, setLabels] = useState(true);
  const [shadows, setShadows] = useState(true);
  const [size, setSize] = useState(128);

  useEffect(() => {
    stateRef.current.size = size;
  }, [size]);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    let last = performance.now();
    let elapsed = 0;
    let frameIndex = 0;

    (async () => {
      const frames: ImageMap = {};
      const heads: ImageMap = {};
      const jobs: Promise<void>[] = [];
      for (const src of IDLE_FRAMES) jobs.push(loadImage(src).then((img) => void (frames[src] = img)));
      for (const p of PERSONAS) jobs.push(loadImage(p.head).then((img) => void (heads[p.id] = img)));
      await Promise.all(jobs);
      if (cancelled) return;
      imagesRef.current = { frames, heads };
      setReady(true);
      last = performance.now();
      raf = requestAnimationFrame(loop);
    })();

    function place(persona: Persona, nodes: ActorNodes): void {
      const stage = stageRef.current;
      if (!stage || !nodes.wrap) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const x = (persona.x / 100) * w;
      const y = (persona.y / 100) * h;
      const box = stateRef.current.size;
      const z = Math.round(persona.y * 10);

      nodes.wrap.style.left = `${x}px`;
      nodes.wrap.style.top = `${y}px`;
      nodes.wrap.style.width = `${box}px`;
      nodes.wrap.style.height = `${box}px`;
      nodes.wrap.style.zIndex = `${z}`;

      if (nodes.shadow) {
        nodes.shadow.style.left = `${x}px`;
        nodes.shadow.style.top = `${y + 4}px`;
        nodes.shadow.style.width = `${box * 0.42}px`;
        nodes.shadow.style.zIndex = `${z - 1}`;
      }
      if (nodes.label) {
        nodes.label.style.left = `${x}px`;
        nodes.label.style.top = `${y - box * 0.78}px`;
        nodes.label.style.zIndex = `${z + 1}`;
      }
    }

    function loop(now: number): void {
      const dt = Math.min(50, now - last);
      last = now;
      elapsed += dt;
      if (elapsed >= IDLE_FRAME_MS) {
        elapsed = 0;
        frameIndex = (frameIndex + 1) % IDLE_FRAMES.length;
      }
      const { frames, heads } = imagesRef.current;
      const frame = frames[IDLE_FRAMES[frameIndex]];
      const cfg = IDLE_FRAME_CONFIG[frameIndex];

      PERSONAS.forEach((persona, i) => {
        const nodes = nodesRef.current[i];
        const head = heads[persona.id];
        if (nodes.ctx && nodes.canvas && frame && head) {
          drawActor(nodes.ctx, nodes.canvas, frame, head, cfg);
        }
        place(persona, nodes);
      });
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background p-3 text-foreground">
      <div className="mx-auto w-full max-w-[1420px]">
        <header className="flex flex-wrap items-stretch gap-3">
          <section className="flex-1 basis-[460px] border border-border bg-card/80 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-emerald-300">
              In-game preview · regen idle
            </p>
            <h1 className="mt-1 text-3xl font-bold uppercase leading-none sm:text-4xl">
              New body idle, three heads
            </h1>
            <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
              The regenerated body-only idle pack composited with each persona&apos;s front head using the
              tuned per-frame config, scaled to our in-game actor size. A fast read of proportion, head fit and
              the idle loop&apos;s cadence in a real stage.
            </p>
          </section>
          <section className="flex basis-[430px] flex-col gap-3 border border-border bg-card/80 p-3">
            <div className="font-mono text-[11px] font-bold uppercase text-muted-foreground">Actor size</div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={88}
                max={220}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <span className="w-14 shrink-0 text-right font-mono text-[11px] font-bold text-muted-foreground">
                {size}px
              </span>
            </div>
            <div className="font-mono text-[11px] font-bold uppercase text-muted-foreground">Extras</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLabels((v) => !v)}
                className={`min-h-9 border px-3 py-2 text-[11px] font-bold uppercase ${
                  labels ? 'border-accent/60 bg-muted text-accent' : 'border-border bg-card text-foreground'
                }`}
              >
                Labels
              </button>
              <button
                onClick={() => setShadows((v) => !v)}
                className={`min-h-9 border px-3 py-2 text-[11px] font-bold uppercase ${
                  shadows ? 'border-accent/60 bg-muted text-accent' : 'border-border bg-card text-foreground'
                }`}
              >
                Shadows
              </button>
              <button
                onClick={() => {
                  setSize(128);
                  setLabels(true);
                  setShadows(true);
                }}
                className="min-h-9 border border-border bg-card px-3 py-2 text-[11px] font-bold uppercase text-foreground"
              >
                Reset
              </button>
            </div>
          </section>
        </header>

        <div className="mt-3 flex flex-wrap gap-2">
          {PERSONAS.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-2 border border-border bg-card/90 px-2.5 py-1.5 font-mono text-[11px] font-bold text-muted-foreground"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.accent }} />
              {p.label}
            </span>
          ))}
        </div>

        <section
          ref={stageRef}
          className="relative mt-3 min-h-[720px] overflow-hidden border border-border bg-cover bg-center"
          style={{ backgroundImage: `url('${IDLE_REGEN_STAGE_BG}')`, backgroundColor: '#081018' }}
        >
          {!ready && (
            <div className="absolute inset-0 grid place-items-center font-mono text-xs uppercase text-muted-foreground">
              Loading sprites…
            </div>
          )}
          {PERSONAS.map((persona, i) => (
            <div key={persona.id}>
              <div
                ref={(el) => {
                  nodesRef.current[i].shadow = el;
                }}
                className="pointer-events-none absolute left-0 top-0 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30 blur-[1px]"
                style={{ opacity: shadows ? 1 : 0 }}
              />
              <div
                ref={(el) => {
                  nodesRef.current[i].wrap = el;
                }}
                className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-full origin-bottom [image-rendering:pixelated] drop-shadow-[0_10px_10px_rgba(0,0,0,0.22)]"
              >
                <canvas
                  ref={(el) => {
                    const node = nodesRef.current[i];
                    node.canvas = el;
                    node.ctx = el?.getContext('2d') ?? null;
                    if (node.ctx) node.ctx.imageSmoothingEnabled = false;
                  }}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="block h-full w-full [image-rendering:pixelated]"
                />
              </div>
              <div
                ref={(el) => {
                  nodesRef.current[i].label = el;
                }}
                className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-full border bg-card/80 px-2 py-1 font-mono text-[11px] font-bold text-foreground backdrop-blur transition-opacity"
                style={{ borderColor: persona.accent, opacity: labels ? 1 : 0 }}
              >
                {persona.label}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
