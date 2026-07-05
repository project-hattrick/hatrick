'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AUTO_MODE,
  BODY_MODES,
  FACE_CONFIG,
  HeadFace,
  PERSONAS,
  PERSONAS_STAGE_BG,
  type BodyMode,
  type Persona,
} from './personas-preview-data';

interface Actor {
  persona: Persona;
  index: number;
  homeX: number;
  x: number;
  y: number;
  phase: number;
  frameTime: number;
  frameIndex: number;
}

/** DOM nodes for an actor, kept apart from its (mutated) sim data so JSX refs never touch the data object. */
interface ActorNodes {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  wrap: HTMLDivElement | null;
  shadow: HTMLDivElement | null;
  label: HTMLDivElement | null;
}

type ImageMap = Record<string, HTMLImageElement>;

const AUTO_CYCLE = ['walk_front', 'run_side', 'walk_back'] as const;

/** One actor per persona, evenly spaced along the pitch. Built once. */
function createActors(): Actor[] {
  const n = PERSONAS.length;
  return PERSONAS.map((persona, index) => ({
    persona,
    index,
    homeX: n === 1 ? 50 : 22 + (index / (n - 1)) * 56,
    x: n === 1 ? 50 : 22 + (index / (n - 1)) * 56,
    y: 74,
    phase: index * 1.7,
    frameTime: 0,
    frameIndex: 0,
  }));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Composite one actor's body frame + head onto its canvas, growing the canvas to fit the head overhang. */
function drawActor(
  actor: Actor,
  nodes: ActorNodes,
  bodies: ImageMap,
  heads: ImageMap,
  mode: BodyMode,
  frameIndex: number,
  mirror: boolean,
): void {
  const { ctx, canvas } = nodes;
  if (!ctx || !canvas) return;
  const frame = bodies[mode.frames[frameIndex % mode.frames.length]];
  const cfg = FACE_CONFIG[mode.face];
  const head = heads[`${actor.persona.id}:${mode.face}`];
  if (!frame || !head) return;

  const bodyW = frame.naturalWidth;
  const bodyH = frame.naturalHeight;
  const headH = bodyH * cfg.headScale;
  const headW = head.naturalWidth * (headH / head.naturalHeight);
  const xShift = bodyW * cfg.offsetXRatio * (mirror ? -1 : 1);
  const yOverlap = bodyH * cfg.offsetYRatio;
  const headX = bodyW * 0.5 - headW * 0.5 + xShift;
  const headY = -headH + yOverlap;

  const minX = Math.floor(Math.min(0, headX));
  const minY = Math.floor(Math.min(0, headY));
  const maxX = Math.ceil(Math.max(bodyW, headX + headW));
  const maxY = Math.ceil(Math.max(bodyH, headY + headH));
  const compositeW = maxX - minX;
  const compositeH = maxY - minY;
  const bodyX = -minX;
  const bodyY = -minY;
  const drawHeadX = headX - minX;
  const drawHeadY = headY - minY;

  if (canvas.width !== compositeW || canvas.height !== compositeH) {
    canvas.width = compositeW;
    canvas.height = compositeH;
    ctx.imageSmoothingEnabled = false;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mirror) {
    ctx.save();
    ctx.translate(bodyX + bodyW, bodyY);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, 0, 0, bodyW, bodyH);
    ctx.restore();
  } else {
    ctx.drawImage(frame, bodyX, bodyY, bodyW, bodyH);
  }

  if (mirror && mode.face === HeadFace.Side) {
    ctx.save();
    ctx.translate(drawHeadX + headW, drawHeadY);
    ctx.scale(-1, 1);
    ctx.drawImage(head, 0, 0, headW, headH);
    ctx.restore();
  } else {
    ctx.drawImage(head, drawHeadX, drawHeadY, headW, headH);
  }
}

export function PersonasPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [actors] = useState<Actor[]>(createActors);
  const actorsRef = useRef<Actor[]>(actors);
  const nodesRef = useRef<ActorNodes[]>(actors.map(() => ({ canvas: null, ctx: null, wrap: null, shadow: null, label: null })));
  const imagesRef = useRef<{ bodies: ImageMap; heads: ImageMap }>({ bodies: {}, heads: {} });
  const stateRef = useRef({ mode: AUTO_MODE, spread: false });

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<string>(AUTO_MODE);
  const [labels, setLabels] = useState(true);
  const [spread, setSpread] = useState(false);

  const modeList = useMemo(() => [{ id: AUTO_MODE, label: 'Auto' }, ...Object.values(BODY_MODES)], []);

  // Mirror the live UI state into a ref the rAF loop reads without re-subscribing.
  useEffect(() => {
    stateRef.current.mode = mode;
    stateRef.current.spread = spread;
  }, [mode, spread]);

  // Load every body frame + persona head, then run the animation loop.
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    let last = performance.now();

    (async () => {
      const bodies: ImageMap = {};
      const heads: ImageMap = {};
      const jobs: Promise<void>[] = [];
      for (const m of Object.values(BODY_MODES)) {
        for (const src of m.frames) jobs.push(loadImage(src).then((img) => void (bodies[src] = img)));
      }
      for (const p of PERSONAS) {
        for (const face of Object.values(HeadFace)) {
          jobs.push(loadImage(p.heads[face]).then((img) => void (heads[`${p.id}:${face}`] = img)));
        }
      }
      await Promise.all(jobs);
      if (cancelled) return;
      imagesRef.current = { bodies, heads };
      setReady(true);
      last = performance.now();
      raf = requestAnimationFrame(loop);
    })();

    function autoFor(actor: Actor): { modeId: string; mirror: boolean } {
      const modeId = AUTO_CYCLE[actor.index % AUTO_CYCLE.length];
      const mirror = modeId === 'run_side' && Math.cos(actor.phase * 1.1) < 0;
      return { modeId, mirror };
    }

    function stepAuto(actor: Actor, dt: number): void {
      actor.phase += dt * 0.001;
      const spreadAmt = stateRef.current.spread ? 6 : 0;
      const drift = (actor.index - (PERSONAS.length - 1) / 2) * spreadAmt;
      actor.x = actor.homeX + drift + Math.sin(actor.phase * 0.8) * 4.6;
      actor.y = 74 + Math.sin(actor.phase * 1.25 + actor.index) * 6.4;
    }

    function place(actor: Actor, nodes: ActorNodes): void {
      const stage = stageRef.current;
      if (!stage || !nodes.wrap) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const x = (actor.x / 100) * w;
      const y = (actor.y / 100) * h;
      const z = Math.round(actor.y * 10);
      nodes.wrap.style.left = `${x}px`;
      nodes.wrap.style.top = `${y}px`;
      nodes.wrap.style.zIndex = `${z}`;
      if (nodes.shadow) {
        nodes.shadow.style.left = `${x}px`;
        nodes.shadow.style.top = `${y + 5}px`;
        nodes.shadow.style.width = `${46 + actor.y * 0.04}px`;
        nodes.shadow.style.zIndex = `${z - 1}`;
      }
      if (nodes.label) {
        nodes.label.style.left = `${x}px`;
        nodes.label.style.top = `${y - 92}px`;
        nodes.label.style.zIndex = `${z + 1}`;
      }
    }

    function loop(now: number): void {
      const dt = Math.min(40, now - last);
      last = now;
      const { bodies, heads } = imagesRef.current;
      const global = stateRef.current.mode;

      actorsRef.current.forEach((actor, i) => {
        const nodes = nodesRef.current[i];
        let modeId = global;
        let mirror = false;
        if (global === AUTO_MODE) {
          stepAuto(actor, dt);
          const auto = autoFor(actor);
          modeId = auto.modeId;
          mirror = auto.mirror;
        } else {
          const spreadAmt = stateRef.current.spread ? 6 : 0;
          actor.x = actor.homeX + (actor.index - (PERSONAS.length - 1) / 2) * spreadAmt;
          actor.y = 74;
        }

        const m = BODY_MODES[modeId];
        actor.frameTime += dt;
        const frameDur = 1000 / m.fps;
        while (actor.frameTime >= frameDur) {
          actor.frameTime -= frameDur;
          actor.frameIndex = (actor.frameIndex + 1) % m.frames.length;
        }
        if (!m.moving) {
          actor.frameIndex = 0;
          actor.frameTime = 0;
        }
        drawActor(actor, nodes, bodies, heads, m, actor.frameIndex, mirror);
        place(actor, nodes);
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
            <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-emerald-300">In-game preview</p>
            <h1 className="mt-1 text-3xl font-bold uppercase leading-none sm:text-4xl">All characters, one body</h1>
            <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
              Every persona rides the same approved body pack, head scale and transitions. A fast read of whether each
              character sits well in front, back and profile before another game system masks it. Grows automatically as
              new heads land.
            </p>
          </section>
          <section className="flex basis-[430px] flex-col gap-3 border border-border bg-card/80 p-3">
            <div className="font-mono text-[11px] font-bold uppercase text-muted-foreground">Mode</div>
            <div className="flex flex-wrap gap-2">
              {modeList.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`min-h-9 border px-3 py-2 text-[11px] font-bold uppercase ${
                    mode === m.id ? 'border-accent/60 bg-muted text-accent' : 'border-border bg-card text-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
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
                onClick={() => setSpread((v) => !v)}
                className={`min-h-9 border px-3 py-2 text-[11px] font-bold uppercase ${
                  spread ? 'border-accent/60 bg-muted text-accent' : 'border-border bg-card text-foreground'
                }`}
              >
                Spread
              </button>
              <button
                onClick={() => {
                  setMode(AUTO_MODE);
                  setSpread(false);
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
          style={{ backgroundImage: `url('${PERSONAS_STAGE_BG}')`, backgroundColor: '#081018' }}
        >
          {!ready && (
            <div className="absolute inset-0 grid place-items-center font-mono text-xs uppercase text-muted-foreground">
              Loading sprites…
            </div>
          )}
          {actors.map((actor, i) => (
            <div key={actor.persona.id}>
              <div
                ref={(el) => {
                  nodesRef.current[i].shadow = el;
                }}
                className="pointer-events-none absolute left-0 top-0 h-4 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30 blur-[1px]"
              />
              <div
                ref={(el) => {
                  nodesRef.current[i].wrap = el;
                }}
                className="pointer-events-none absolute left-0 top-0 h-24 w-24 -translate-x-1/2 -translate-y-full origin-bottom [image-rendering:pixelated] drop-shadow-[0_10px_10px_rgba(0,0,0,0.22)]"
              >
                <canvas
                  ref={(el) => {
                    const node = nodesRef.current[i];
                    node.canvas = el;
                    node.ctx = el?.getContext('2d') ?? null;
                    if (node.ctx) node.ctx.imageSmoothingEnabled = false;
                  }}
                  width={96}
                  height={96}
                  className="block h-full w-full [image-rendering:pixelated]"
                />
              </div>
              <div
                ref={(el) => {
                  nodesRef.current[i].label = el;
                }}
                className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-full border bg-card/80 px-2 py-1 font-mono text-[11px] font-bold text-foreground backdrop-blur transition-opacity"
                style={{ borderColor: actor.persona.accent, opacity: labels ? 1 : 0 }}
              >
                {actor.persona.label}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
