'use client';

import { useCallback, useEffect, useRef } from 'react';

const NEUTRAL = ['#aef019', '#3b82f6', '#ef4444', '#f0c24f', '#ffffff', '#22d3ee', '#fb7185'];

/** Country-ish palettes keyed by the scoring team (swap for real matchup flags any time). */
const TEAM_COLORS: Record<string, string[]> = {
  blue: ['#0055A4', '#ffffff', '#EF4135', '#cfe0ff'], // Blue → France-style
  red: ['#AA151B', '#F1BF00', '#ffffff', '#ffe08a'], // Red → Spain-style
};

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

/** Pixel confetti that bursts each time `active` flips true (goal celebration), in the scorer's colors. */
export function ConfettiBurst({ active, team = '' }: { active: boolean; team?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef(0);
  const running = useRef(false);
  const teamRef = useRef(team);
  useEffect(() => {
    teamRef.current = team;
  }, [team]);

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
    const palette = TEAM_COLORS[teamRef.current] ?? NEUTRAL;
    const ps = particles.current;
    // Spawn across the FULL screen width so confetti covers 100%.
    for (let i = 0; i < 300; i++) {
      ps.push({
        x: Math.random() * W,
        y: -20 - Math.random() * 120,
        vx: (Math.random() - 0.5) * 7,
        vy: Math.random() * 4 + 2,
        size: 4 + Math.floor(Math.random() * 7),
        color: palette[Math.floor(Math.random() * palette.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
      });
    }
    ensureLoop();
  }, [active, ensureLoop]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[22]" style={{ imageRendering: 'pixelated' }} />;
}
