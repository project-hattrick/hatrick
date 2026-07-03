'use client';

import { useEffect, useRef, useState } from 'react';

const CW = 120;
const CH = 150;
const CX = 60;
const FEET = 98;
const TAU = Math.PI * 2;
const TEAL = '#4fe6d4';
const GLOW = '#8ff6ea';
const GOLD = '#f0c24f';

const px = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(x | 0, y | 0, w, h);
};

function grass(ctx: CanvasRenderingContext2D) {
  for (let x = 0; x < CW; x += 14) {
    px(ctx, x, 0, 7, CH, '#3a9c44');
    px(ctx, x + 7, 0, 7, CH, '#33903c');
  }
}

function player(ctx: CanvasRenderingContext2D) {
  ctx.globalAlpha = 0.25;
  px(ctx, CX - 7, FEET + 1, 14, 5, '#000');
  ctx.globalAlpha = 1;
  const b = FEET;
  px(ctx, CX - 3, b - 2, 3, 2, '#20242e');
  px(ctx, CX + 1, b - 2, 3, 2, '#20242e');
  px(ctx, CX - 3, b - 6, 3, 4, '#e8c39e');
  px(ctx, CX + 1, b - 6, 3, 4, '#e8c39e');
  px(ctx, CX - 4, b - 9, 8, 3, '#f4f4f0');
  px(ctx, CX - 4, b - 16, 8, 7, '#1b2a4a');
  px(ctx, CX - 4, b - 16, 8, 1, '#f4f4f0');
  px(ctx, CX - 6, b - 15, 2, 5, '#1b2a4a');
  px(ctx, CX + 4, b - 15, 2, 5, '#1b2a4a');
  px(ctx, CX - 3, b - 20, 6, 4, '#e8c39e');
  px(ctx, CX - 3, b - 21, 6, 2, '#2a2118');
}

type Layer = (ctx: CanvasRenderingContext2D, t: number) => void;
interface Variation {
  name: string;
  ground?: Layer;
  over?: Layer;
}

const VARIATIONS: Variation[] = [
  {
    name: 'Pixel dots',
    ground: (ctx, t) => {
      const pulse = (Math.floor(t / 220) % 3) * 1.2;
      const rr = 13 + pulse;
      ctx.fillStyle = TEAL;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        px(ctx, Math.round(CX + Math.cos(a) * rr) - 1, Math.round(FEET + Math.sin(a) * rr * 0.42) - 1, 2, 2, TEAL);
      }
    },
  },
  {
    name: 'Pixel arrow',
    over: (ctx, t) => {
      const ay = FEET - 34 + ((Math.floor(t / 180) % 3) - 1);
      px(ctx, CX - 4, ay, 9, 2, TEAL);
      px(ctx, CX - 3, ay + 2, 7, 2, TEAL);
      px(ctx, CX - 2, ay + 4, 5, 2, TEAL);
      px(ctx, CX - 1, ay + 6, 3, 2, GLOW);
    },
  },
  {
    name: 'Solid ring',
    ground: (ctx, t) => {
      const p = (Math.sin(t * 0.005) + 1) / 2;
      const rr = 12 + p * 3;
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(CX, FEET, rr, rr * 0.42, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = TEAL;
      ctx.beginPath();
      ctx.ellipse(CX, FEET, rr - 2, rr * 0.42 - 1, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  },
  {
    name: 'Diamond',
    ground: (ctx, t) => {
      const s = 9;
      const g = Math.floor(t / 200) % 2;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(CX, FEET - 4 - g);
      ctx.lineTo(CX + s, FEET);
      ctx.lineTo(CX, FEET + 4 + g);
      ctx.lineTo(CX - s, FEET);
      ctx.closePath();
      ctx.stroke();
    },
  },
  {
    name: 'Brackets',
    ground: (ctx) => {
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 1.6;
      const w = 15;
      const h = 7;
      const arm = 5;
      const corner = (sx: number, sy: number, dx: number, dy: number) => {
        ctx.beginPath();
        ctx.moveTo(CX + sx, FEET + sy + dy * arm);
        ctx.lineTo(CX + sx, FEET + sy);
        ctx.lineTo(CX + sx + dx * arm, FEET + sy);
        ctx.stroke();
      };
      corner(-w, -h, 1, 1);
      corner(w, -h, -1, 1);
      corner(-w, h, 1, -1);
      corner(w, h, -1, -1);
    },
  },
  {
    name: 'Triangle',
    over: (ctx, t) => {
      const ay = FEET - 33 + Math.sin(t * 0.006) * 2;
      ctx.fillStyle = TEAL;
      ctx.beginPath();
      ctx.moveTo(CX - 5, ay);
      ctx.lineTo(CX + 5, ay);
      ctx.lineTo(CX, ay + 7);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: 'Spinning dashes',
    ground: (ctx, t) => {
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 2;
      const rot = t * 0.002;
      for (let i = 0; i < 8; i++) {
        const a = rot + (i / 8) * TAU;
        const rr = 13;
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a) * rr, FEET + Math.sin(a) * rr * 0.42);
        ctx.lineTo(CX + Math.cos(a) * (rr + 3.5), FEET + Math.sin(a) * (rr + 3.5) * 0.42);
        ctx.stroke();
      }
    },
  },
  {
    name: 'Glow disc',
    ground: (ctx, t) => {
      const p = (Math.sin(t * 0.004) + 1) / 2;
      ctx.save();
      ctx.globalAlpha = 0.3 + p * 0.25;
      ctx.translate(CX, FEET);
      ctx.scale(1, 0.42);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
      g.addColorStop(0, TEAL);
      g.addColorStop(1, 'rgba(79,230,212,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, TAU);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    name: 'Underline bar',
    ground: (ctx) => {
      px(ctx, CX - 11, FEET + 3, 22, 2, TEAL);
      px(ctx, CX - 2, FEET + 5, 4, 1, GLOW);
    },
  },
];

function MarkerCell({ v, selected, onSelect }: { v: Variation; selected: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    const loop = (t: number) => {
      ctx.clearRect(0, 0, CW, CH);
      grass(ctx);
      v.ground?.(ctx, t);
      player(ctx);
      v.over?.(ctx, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [v]);

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 rounded-lg border p-3 ${selected ? 'border-sky-400 bg-slate-800' : 'border-slate-700 bg-slate-900'}`}
    >
      <canvas ref={ref} width={CW} height={CH} className="rounded" style={{ width: CW * 2, height: CH * 2, imageRendering: 'pixelated' }} />
      <span className="text-xs font-semibold text-slate-200">{v.name}</span>
    </button>
  );
}

/** Dev page: active-player marker variations to pick from. */
export function MarkerVariations() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-5xl p-6 text-slate-100">
      <h1 className="text-lg font-semibold">Active-player marker — variations</h1>
      <p className="mt-1 text-sm text-slate-400">
        Click one to pick it. Tell me the name and I&apos;ll wire it as the sandbox&apos;s active-player marker.
        {selected ? <span className="ml-2 font-semibold text-sky-300">Selected: {selected}</span> : null}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {VARIATIONS.map((v) => (
          <MarkerCell key={v.name} v={v} selected={selected === v.name} onSelect={() => setSelected(v.name)} />
        ))}
      </div>
    </div>
  );
}
