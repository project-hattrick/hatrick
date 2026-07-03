import { textToColumns } from './font';

/** LED color set for one state ladder: board background, unlit dot, dim glow, full-bright dot. */
export interface LedTheme {
  bg: string;
  off: string;
  dim: string;
  bright: string;
}

/** Named palettes used by both the billboards and the `<LightBoard>` component. */
export const LED_THEMES: Record<string, LedTheme> = {
  amber: { bg: '#160d00', off: 'rgba(120,80,0,0.16)', dim: 'rgba(255,170,40,0.35)', bright: 'rgba(255,196,72,0.98)' },
  blue: { bg: '#04101e', off: 'rgba(60,110,160,0.16)', dim: 'rgba(120,180,255,0.4)', bright: 'rgba(190,225,255,0.98)' },
  green: { bg: '#02160c', off: 'rgba(40,140,80,0.16)', dim: 'rgba(80,230,140,0.4)', bright: 'rgba(170,255,205,0.98)' },
  red: { bg: '#1a0406', off: 'rgba(150,50,60,0.16)', dim: 'rgba(255,110,120,0.4)', bright: 'rgba(255,180,190,0.98)' },
  white: { bg: '#0a0c12', off: 'rgba(150,160,190,0.16)', dim: 'rgba(200,210,235,0.45)', bright: 'rgba(245,248,255,1)' },
};

export const DEFAULT_LED_THEME = LED_THEMES.amber;

export interface LedMarqueeOptions {
  text: string;
  /** Vertical dot count (board height in dots). */
  rows?: number;
  /** Scroll speed in dot-columns per second. */
  speed?: number;
  theme?: LedTheme;
  /** Fraction of a cell the lit dot fills (0..1). */
  dotFill?: number;
}

const DEFAULTS = { rows: 7, speed: 9, dotFill: 0.82 };

/**
 * Paints a scrolling dot-matrix marquee into the rect (x, y, w, h) of `ctx`, deterministic in `timeMs`.
 * The cell size is derived from the rect height and the row count so the text always fills the board.
 * Used by the engine (into an offscreen canvas that is then warped into a perspective quad) and the
 * DOM `<LightBoard>` (straight onto its own canvas).
 */
export function drawLedMarquee(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: LedMarqueeOptions,
  timeMs: number,
): void {
  const rows = Math.max(5, Math.round(opts.rows ?? DEFAULTS.rows));
  const speed = opts.speed ?? DEFAULTS.speed;
  const theme = opts.theme ?? DEFAULT_LED_THEME;
  const dotFill = opts.dotFill ?? DEFAULTS.dotFill;

  const cell = h / rows;
  const cols = Math.max(1, Math.ceil(w / cell));
  const dotR = (cell * dotFill) / 2;

  // Board backing.
  ctx.fillStyle = theme.bg;
  ctx.fillRect(x, y, w, h);

  const pattern = textToColumns(opts.text || ' ', rows, 1);
  // A run of blank columns between loops so the message clearly restarts.
  const patternWidth = pattern.length + Math.max(cols, 6);
  const offset = Math.floor((timeMs / 1000) * speed);

  for (let c = 0; c < cols; c++) {
    const src = (((c + offset) % patternWidth) + patternWidth) % patternWidth;
    const column = src < pattern.length ? pattern[src] : null;
    const cx = x + c * cell + cell / 2;
    for (let r = 0; r < rows; r++) {
      const lit = column ? column[r] : false;
      ctx.fillStyle = lit ? theme.bright : theme.off;
      ctx.beginPath();
      ctx.arc(cx, y + r * cell + cell / 2, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
