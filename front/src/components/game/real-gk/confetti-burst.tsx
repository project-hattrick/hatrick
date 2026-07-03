'use client';

import { useCallback, useEffect, useRef } from 'react';

const COLORS = ['#aef019', '#3b82f6', '#ef4444', '#f0c24f', '#ffffff', '#22d3ee', '#fb7185'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
}

/** Pixel confetti that bursts each time `active` flips true (goal celebration). */
export function ConfettiBurst({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef(0);
  const running = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.imageSmoothingEnabled = false;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  // Runs only while particles are alive, then parks itself.
  const ensureLoop = useCallback(() => {
    if (running.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    running.current = true;
    const step = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        running.current = false;
        return;
      }
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);
      const ps = particles.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.vy += 0.28; // gravity
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        if (p.y > H + 24) ps.splice(i, 1);
      }
      if (ps.length > 0) {
        raf.current = requestAnimationFrame(step);
      } else {
        running.current = false;
        ctx.clearRect(0, 0, W, H);
      }
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (!active) return;
    const W = canvasRef.current?.width || window.innerWidth;
    const ps = particles.current;
    for (let i = 0; i < 180; i++) {
      ps.push({
        x: W * 0.5 + (Math.random() - 0.5) * W * 0.55,
        y: -20 - Math.random() * 90,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * 4 + 2,
        size: 4 + Math.floor(Math.random() * 7),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
      });
    }
    ensureLoop();
  }, [active, ensureLoop]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[22]" style={{ imageRendering: 'pixelated' }} />;
}
