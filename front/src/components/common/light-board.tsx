'use client';

import { useEffect, useRef } from 'react';
import { DEFAULT_LED_THEME, drawLedMarquee, LED_THEMES, type LedTheme } from '@/lib/led/marquee';

export interface LightBoardProps {
  text: string;
  /** Palette name (`amber` | `blue` | `green` | `red` | `white`) or an explicit theme. */
  theme?: keyof typeof LED_THEMES | LedTheme;
  /** Vertical dot count. */
  rows?: number;
  /** Scroll speed in dot-columns per second. */
  speed?: number;
  /** CSS pixel height of the board (width fills the parent). */
  height?: number;
  className?: string;
}

function resolveTheme(theme: LightBoardProps['theme']): LedTheme {
  if (!theme) return DEFAULT_LED_THEME;
  return typeof theme === 'string' ? LED_THEMES[theme] ?? DEFAULT_LED_THEME : theme;
}

/**
 * A self-contained scrolling LED marquee (dot-matrix), driven by the shared framework-free renderer.
 * This is the DOM counterpart of the in-game billboards: same look, used for previews and standalone UI.
 */
export function LightBoard({ text, theme, rows = 7, speed = 9, height = 40, className }: LightBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const resolved = resolveTheme(theme);
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const sync = () => {
      const w = Math.max(1, Math.floor(wrap.clientWidth));
      if (canvas.width !== w * dpr || canvas.height !== height * dpr) {
        canvas.width = w * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${height}px`;
      }
    };

    const loop = (t: number) => {
      sync();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawLedMarquee(ctx, 0, 0, canvas.width / dpr, canvas.height / dpr, { text, rows, speed, theme: resolved }, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(sync);
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [text, theme, rows, speed, height]);

  return (
    <div ref={wrapRef} className={className} style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 4 }} />
    </div>
  );
}
