'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const FRAME_NAMES = ['frame_01.png', 'frame_02.png', 'frame_03.png', 'frame_04.png'] as const;

const FRAME_SETS = {
  idle_front: { label: 'Idle Front', fps: 2, frames: FRAME_NAMES },
  walk_front: { label: 'Walk Front', fps: 5, frames: FRAME_NAMES },
  walk_back: { label: 'Walk Back', fps: 5, frames: FRAME_NAMES },
  run_front: { label: 'Run Front', fps: 7, frames: FRAME_NAMES },
  run_back: { label: 'Run Back', fps: 7, frames: FRAME_NAMES },
  run_side: { label: 'Run Side', fps: 7, frames: FRAME_NAMES },
} as const;

type FrameSetId = keyof typeof FRAME_SETS;

interface Position {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function FranceSandbox() {
  const [frameSetId, setFrameSetId] = useState<FrameSetId>('run_front');
  const [frameIndex, setFrameIndex] = useState(0);
  const [fps, setFps] = useState(FRAME_SETS.run_front.fps);
  const [scale, setScale] = useState(410);
  const [isPlaying, setIsPlaying] = useState(true);
  const [position, setPosition] = useState<Position>({ x: 50, y: 58 });
  const keysRef = useRef(new Set<string>());
  const lastFrameRef = useRef(0);

  const frameSet = FRAME_SETS[frameSetId];
  const frameSrc = useMemo(
    () => `/game/franca/${frameSetId}/${frameSet.frames[frameIndex]}`,
    [frameIndex, frameSet.frames, frameSetId],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.startsWith('Arrow') || event.key === 'Shift') {
        keysRef.current.add(event.key);
        event.preventDefault();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const keys = keysRef.current;
      const move = keys.has('Shift') ? 0.42 : 0.24;
      if (keys.size > 0) {
        setPosition((current) => ({
          x: clamp(current.x + (keys.has('ArrowRight') ? move : 0) - (keys.has('ArrowLeft') ? move : 0), 9, 91),
          y: clamp(current.y + (keys.has('ArrowDown') ? move : 0) - (keys.has('ArrowUp') ? move : 0), 16, 88),
        }));
      }
      if (isPlaying && now - lastFrameRef.current >= 1000 / fps) {
        setFrameIndex((current) => (current + 1) % frameSet.frames.length);
        lastFrameRef.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fps, frameSet.frames.length, isPlaying]);

  const selectFrameSet = (nextFrameSetId: FrameSetId) => {
    setFrameSetId(nextFrameSetId);
    setFrameIndex(0);
    setFps(FRAME_SETS[nextFrameSetId].fps);
  };

  return (
    <main className="min-h-screen bg-[#08111f] text-slate-100">
      <div className="grid min-h-screen grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 border-r border-white/10 bg-slate-950/70 p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-300">sandbox</p>
            <h1 className="mt-1 text-xl font-bold">França</h1>
          </div>

          <label className="grid gap-2 text-xs font-semibold text-slate-300">
            Animation
            <select
              value={frameSetId}
              onChange={(event) => selectFrameSet(event.target.value as FrameSetId)}
              className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              {Object.entries(FRAME_SETS).map(([id, config]) => (
                <option key={id} value={id}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((current) => !current)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                isPlaying ? 'border-sky-300 bg-sky-500 text-slate-950' : 'border-white/10 bg-slate-900 text-white'
              }`}
            >
              {isPlaying ? 'Play' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={() => setPosition({ x: 50, y: 58 })}
              className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Center
            </button>
          </div>

          <label className="grid gap-2 text-xs font-semibold text-slate-300">
            Frame
            <input
              type="range"
              min={0}
              max={frameSet.frames.length - 1}
              value={frameIndex}
              onChange={(event) => {
                setIsPlaying(false);
                setFrameIndex(Number(event.target.value));
              }}
            />
          </label>

          <label className="grid gap-2 text-xs font-semibold text-slate-300">
            FPS
            <input type="range" min={1} max={12} value={fps} onChange={(event) => setFps(Number(event.target.value))} />
          </label>

          <label className="grid gap-2 text-xs font-semibold text-slate-300">
            Scale
            <input
              type="range"
              min={180}
              max={720}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
            />
          </label>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md border border-white/10 bg-slate-900/70 p-3 text-xs">
            <dt className="text-slate-400">Type</dt>
            <dd className="font-semibold text-white">França</dd>
            <dt className="text-slate-400">Canvas</dt>
            <dd className="font-semibold text-white">2048x2048</dd>
            <dt className="text-slate-400">Frame</dt>
            <dd className="font-semibold text-white">{frameIndex + 1}</dd>
            <dt className="text-slate-400">FPS</dt>
            <dd className="font-semibold text-white">{fps}</dd>
          </dl>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-300">
            <span />
            <span className="rounded-md border border-white/10 bg-slate-900 py-2">Up</span>
            <span />
            <span className="rounded-md border border-white/10 bg-slate-900 py-2">Left</span>
            <span className="rounded-md border border-white/10 bg-slate-900 py-2">Down</span>
            <span className="rounded-md border border-white/10 bg-slate-900 py-2">Right</span>
          </div>
        </aside>

        <section className="flex min-w-0 items-center justify-center p-5">
          <div className="relative aspect-[16/10] w-full max-w-6xl overflow-hidden border border-white/20 bg-[repeating-linear-gradient(90deg,#23713d_0_90px,#1f6537_90px_180px)] shadow-2xl">
            <div className="absolute inset-6 border-2 border-white/70" />
            <div className="absolute bottom-6 top-6 left-1/2 border-l-2 border-white/70" />
            <div className="absolute left-1/2 top-1/2 aspect-square w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
            <div className="absolute bottom-[25%] left-6 top-[25%] w-[13%] border-y-2 border-r-2 border-white/70" />
            <div className="absolute bottom-[25%] right-6 top-[25%] w-[13%] border-y-2 border-l-2 border-white/70" />
            <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-slate-950/75 px-3 py-1 text-sm font-bold">
              França
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- frame-swapped sandbox sprite */}
            <img
              src={frameSrc}
              alt="França sprite"
              className="absolute -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-2xl"
              style={{ left: `${position.x}%`, top: `${position.y}%`, width: scale, height: scale }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
