import { RainLevel } from '../enums';

interface Size {
  width: number;
  height: number;
}

interface Drop {
  x: number;
  y: number;
  l: number;
  s: number;
  o: number;
}

const RAIN_MAX = 520;
const WIND = 2.6;

export const RAIN_LABEL: Record<RainLevel, string> = {
  [RainLevel.Strong]: 'STRONG',
  [RainLevel.Medium]: 'MEDIUM',
  [RainLevel.Off]: 'OFF',
};

const DROP_FACTOR: Record<RainLevel, number> = {
  [RainLevel.Strong]: 1,
  [RainLevel.Medium]: 0.55,
  [RainLevel.Off]: 0,
};

const OVERLAY_ALPHA: Record<RainLevel, number> = {
  [RainLevel.Strong]: 0.34,
  [RainLevel.Medium]: 0.22,
  [RainLevel.Off]: 0,
};

export interface RainSystem {
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  cycle: () => string;
  label: () => string;
}

/** Screen-space rain + lightning, drawn over the world. Cosmetic, ported from game_chuva.html. */
export function createRainSystem(canvas: Size, initial: RainLevel): RainSystem {
  const cw = canvas.width;
  const ch = canvas.height;
  let level = initial;
  let flash = 0;
  let boltCd = 200 + Math.random() * 260;

  const drops: Drop[] = Array.from({ length: RAIN_MAX }, () => ({
    x: Math.random() * cw,
    y: Math.random() * ch,
    l: 10 + Math.random() * 22,
    s: 16 + Math.random() * 16,
    o: 0.1 + Math.random() * 0.22,
  }));

  const count = (): number => Math.floor(drops.length * DROP_FACTOR[level]);

  const update = (): void => {
    const cnt = count();
    for (let i = 0; i < cnt; i++) {
      const d = drops[i];
      d.y += d.s;
      d.x += WIND;
      if (d.y > ch) {
        d.y = -d.l;
        d.x = Math.random() * cw;
      }
    }
    if (level > RainLevel.Off) {
      boltCd--;
      if (boltCd <= 0) {
        flash = 0.9 + Math.random() * 0.6;
        boltCd = (level === RainLevel.Strong ? 160 : 300) + Math.random() * 320;
      }
    }
    if (flash > 0) flash *= 0.8;
  };

  const draw = (ctx: CanvasRenderingContext2D): void => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (level > RainLevel.Off) {
      ctx.fillStyle = `rgba(18,28,52,${OVERLAY_ALPHA[level]})`;
      ctx.fillRect(0, 0, cw, ch);
    }
    if (flash > 0.03) {
      ctx.fillStyle = `rgba(205,222,255,${Math.min(0.5, flash * 0.5)})`;
      ctx.fillRect(0, 0, cw, ch);
    }
    const cnt = count();
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < cnt; i++) {
      const d = drops[i];
      ctx.strokeStyle = `rgba(200,216,238,${d.o})`;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - WIND * 1.6, d.y + d.l);
      ctx.stroke();
    }
  };

  const cycle = (): string => {
    level = ((level + 2) % 3) as RainLevel;
    return RAIN_LABEL[level];
  };

  return { update, draw, cycle, label: () => RAIN_LABEL[level] };
}
