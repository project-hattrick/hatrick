import { drawLedMarquee, LED_THEMES } from '../../lib/led/marquee';
import type { RealGkWorld } from './types';

/** Advertiser panel kinds: a static ad image, or an animated scrolling LED board. */
export enum BillboardKind {
  Image = 'image',
  Led = 'led',
}

/** A perimeter advertiser panel. Corners are field-ratios of `world.size` (TL, TR, BR, BL). */
export interface Billboard {
  kind: BillboardKind;
  /** Four corners in ratios of the virtual pitch: [topLeft, topRight, bottomRight, bottomLeft]. */
  corners: [number, number][];
  /** Image source (relative to /public) — for `BillboardKind.Image`. */
  src?: string;
  /** Marquee text — for `BillboardKind.Led`. */
  text?: string;
  /** LED palette key (see LED_THEMES) — for `BillboardKind.Led`. */
  theme?: keyof typeof LED_THEMES;
  /** Marquee scroll speed (dot-columns/sec). */
  speed?: number;
  /** Overall opacity (0..1). */
  opacity?: number;
}

/**
 * Placed advertiser panels (authored in /sandbox/billboard-editor). Perimeter boards along the far
 * touchline by default — drag/retune them in the editor and paste the exported array back here.
 */
export const BILLBOARDS: Billboard[] = [
  {
    kind: BillboardKind.Led,
    corners: [[0.255, 0.3], [0.44, 0.3], [0.44, 0.336], [0.255, 0.336]],
    text: 'TXODDS  ·  WORLD CUP 26',
    theme: 'amber',
    speed: 9,
  },
  {
    kind: BillboardKind.Image,
    corners: [[0.45, 0.3], [0.55, 0.3], [0.55, 0.336], [0.45, 0.336]],
    src: '/game/ads/hat-trick.svg',
  },
  {
    kind: BillboardKind.Led,
    corners: [[0.56, 0.3], [0.745, 0.3], [0.745, 0.336], [0.56, 0.336]],
    text: 'PLAY LIVE  ·  TXLINE',
    theme: 'blue',
    speed: 9,
  },
  // Left touchline hoarding, beside the left goal (recedes back → front along the sideline).
  {
    kind: BillboardKind.Led,
    corners: [[0.209, 0.364], [0.178, 0.44], [0.178, 0.515], [0.209, 0.409]],
    text: 'TxODDS  ·  LIVE',
    theme: 'green',
    speed: 8,
  },
  // Right touchline hoarding, beside the right goal (mirror of the left).
  {
    kind: BillboardKind.Led,
    corners: [[0.79, 0.364], [0.821, 0.44], [0.821, 0.515], [0.79, 0.409]],
    text: 'BET  ·  WIN',
    theme: 'red',
    speed: 8,
  },
];

const imageCache = new Map<string, HTMLImageElement>();

function loadAd(src: string): HTMLImageElement {
  const hit = imageCache.get(src);
  if (hit) return hit;
  const img = new Image();
  img.src = src;
  imageCache.set(src, img);
  return img;
}

// One reusable offscreen canvas for the LED marquee (resized per board, per frame).
let scratch: HTMLCanvasElement | null = null;
function scratchCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== w || scratch.height !== h) {
    scratch.width = w;
    scratch.height = h;
  }
  const ctx = scratch.getContext('2d');
  return ctx ? { canvas: scratch, ctx } : null;
}

const dist = (a: number[], b: number[]): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const clampInt = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, Math.round(v)));

/** Nudge a point away from the quad centroid to hide the diagonal seam between the two triangles. */
function expand(p: number[], cx: number, cy: number, by = 0.4): [number, number] {
  const dx = p[0] - cx;
  const dy = p[1] - cy;
  const len = Math.hypot(dx, dy) || 1;
  return [p[0] + (dx / len) * by, p[1] + (dy / len) * by];
}

/** Affine texture-map one triangle: source uv → dest xy, clipped to the dest triangle. */
function texTriangle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x0: number, y0: number, x1: number, y1: number, x2: number, y2: number,
  u0: number, v0: number, u1: number, v1: number, u2: number, v2: number,
): void {
  const denom = u0 * (v2 - v1) - u1 * v2 + u2 * v1 + (u1 - u2) * v0;
  if (denom === 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.clip();
  const m11 = -(v0 * (x2 - x1) - v1 * x2 + v2 * x1 + (v1 - v2) * x0) / denom;
  const m12 = (v1 * y2 + v0 * (y1 - y2) - v2 * y1 + (v2 - v1) * y0) / denom;
  const m21 = (u0 * (x2 - x1) - u1 * x2 + u2 * x1 + (u1 - u2) * x0) / denom;
  const m22 = -(u1 * y2 + u0 * (y1 - y2) - u2 * y1 + (u2 - u1) * y0) / denom;
  const dx = (u0 * (v2 * x1 - v1 * x2) + v0 * (u1 * x2 - u2 * x1) + (u2 * v1 - u1 * v2) * x0) / denom;
  const dy = (u0 * (v2 * y1 - v1 * y2) + v0 * (u1 * y2 - u2 * y1) + (u2 * v1 - u1 * v2) * y0) / denom;
  ctx.transform(m11, m12, m21, m22, dx, dy);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/** Warp a source image/canvas (sw×sh) into a 4-corner quad (px), split into two triangles. */
export function drawImageQuad(ctx: CanvasRenderingContext2D, img: CanvasImageSource, sw: number, sh: number, pts: number[][]): void {
  const cx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4;
  const cy = (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) / 4;
  const [tl, tr, br, bl] = pts.map((p) => expand(p, cx, cy));
  texTriangle(ctx, img, tl[0], tl[1], tr[0], tr[1], br[0], br[1], 0, 0, sw, 0, sw, sh);
  texTriangle(ctx, img, tl[0], tl[1], br[0], br[1], bl[0], bl[1], 0, 0, sw, sh, 0, sh);
}

/**
 * Paints all advertiser panels pinned to the pitch (world space, so they pan with the follow camera).
 * Image boards warp their art into the quad; LED boards render a marquee to an offscreen canvas first.
 * No-op unless the variant opts in via `features.billboards`.
 */
export function drawBillboards(ctx: CanvasRenderingContext2D, world: RealGkWorld, now: number): void {
  if (!world.cfg.features?.billboards) return;
  const { width, height } = world.size;

  for (const bb of BILLBOARDS) {
    const pts = bb.corners.map(([x, y]) => [x * width, y * height]);
    ctx.save();
    ctx.globalAlpha = bb.opacity ?? 1;

    if (bb.kind === BillboardKind.Image && bb.src) {
      const img = loadAd(bb.src);
      if (img.complete && img.naturalWidth) drawImageQuad(ctx, img, img.naturalWidth, img.naturalHeight, pts);
    } else if (bb.kind === BillboardKind.Led) {
      const topW = dist(pts[0], pts[1]);
      const botW = dist(pts[3], pts[2]);
      const leftH = dist(pts[0], pts[3]);
      const ow = clampInt(Math.max(topW, botW) * 2, 16, 1024);
      const oh = clampInt(leftH * 2, 8, 256);
      const scr = scratchCanvas(ow, oh);
      if (scr) {
        drawLedMarquee(scr.ctx, 0, 0, ow, oh, { text: bb.text ?? '', theme: LED_THEMES[bb.theme ?? 'amber'], speed: bb.speed ?? 9 }, now);
        drawImageQuad(ctx, scr.canvas, ow, oh, pts);
      }
    }

    ctx.restore();
  }
}
