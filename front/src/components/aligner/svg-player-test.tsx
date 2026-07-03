'use client';

import { useEffect, useState } from 'react';

interface Anim {
  label: string;
  base: string;
  frames: number;
  fps: number;
}

const ANIMS: Anim[] = [
  { label: 'Idle (front)', base: 'idle_front', frames: 4, fps: 2.4 },
  { label: 'Run (side)', base: 'run_side', frames: 4, fps: 10 },
];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Renders one anim as a looping <img> swap, from the given asset root/extension. */
function AnimSprite({ anim, root, ext, now, height, pixelated }: { anim: Anim; root: string; ext: string; now: number; height: number; pixelated: boolean }) {
  const frame = Math.floor((now / 1000) * anim.fps) % anim.frames;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- frame-swapped sprite, next/image would fight the animation
    <img
      src={`${root}/${anim.base}_frame_${pad2(frame + 1)}.${ext}`}
      alt={anim.label}
      style={{ height, width: 'auto', imageRendering: pixelated ? 'pixelated' : 'auto', objectFit: 'contain' }}
      draggable={false}
    />
  );
}

/** v5 test: vectorized (SVG, body-normalized) sprites vs the original PNGs, side by side. */
export function SvgPlayerTest() {
  const [now, setNow] = useState(0);
  const [height, setHeight] = useState(150);
  const [pitch, setPitch] = useState(true);

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      setNow(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const cellBg = pitch ? '#2f7d4f' : '#0b1220';

  return (
    <div className="mx-auto max-w-4xl p-6 text-slate-100">
      <h1 className="text-lg font-semibold">v5 — SVG player test</h1>
      <p className="mt-1 text-sm text-slate-400">
        Pixel sprites vectorized (downsampled + color-quantized to flat blocks) with every body normalized to
        the same height. Left = new SVG, right = original PNG.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-2">
          size
          <input type="range" min={80} max={300} value={height} onChange={(e) => setHeight(+e.target.value)} />
          {height}px
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={pitch} onChange={(e) => setPitch(e.target.checked)} />
          pitch background
        </label>
      </div>

      <div className="mt-6 space-y-8">
        {ANIMS.map((anim) => (
          <div key={anim.base}>
            <h2 className="mb-2 text-sm font-semibold text-slate-300">{anim.label}</h2>
            <div className="flex gap-4">
              {[
                { tag: 'SVG (v5)', root: '/game/real-gk-v5', ext: 'svg', px: false },
                { tag: 'PNG (original)', root: '/game/real-gk', ext: 'png', px: true },
              ].map((v) => (
                <div key={v.tag} className="flex flex-col items-center">
                  <div
                    className="flex items-end justify-center rounded-lg border border-slate-700"
                    style={{ background: cellBg, width: height * 1.6, height: height + 32, padding: 12 }}
                  >
                    <AnimSprite anim={anim} root={v.root} ext={v.ext} now={now} height={height} pixelated={v.px} />
                  </div>
                  <span className="mt-1 text-[11px] text-slate-400">{v.tag}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
