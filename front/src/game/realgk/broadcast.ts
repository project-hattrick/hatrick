import type { Size } from './types';
import { clamp } from './util';

/** Broadcast dressing drawn in screen space on top of the scene — canvas-only, works in any host. */

const LETTERBOX_RATIO = 0.1;
const TAG_BLINK_HZ = 1.4;

interface WipeBand {
  from: string;
  to: string;
  fromLeft: boolean;
}

const BANDS: WipeBand[] = [
  { from: '#3b82f6', to: '#0b3a63', fromLeft: true },
  { from: '#ef4444', to: '#5c1010', fromLeft: false },
];

function drawBand(ctx: CanvasRenderingContext2D, view: Size, band: WipeBand, coverage: number, yTop: number, yBottom: number): void {
  const skew = view.height * 0.35;
  const reach = (view.width + skew * 2) * coverage;
  const gradient = ctx.createLinearGradient(band.fromLeft ? 0 : view.width, 0, band.fromLeft ? view.width : 0, 0);
  gradient.addColorStop(0, band.from);
  gradient.addColorStop(1, band.to);

  const edgeX = band.fromLeft ? reach - skew : view.width - reach + skew;
  const backX = band.fromLeft ? -skew : view.width + skew;

  ctx.beginPath();
  ctx.moveTo(backX, yTop);
  ctx.lineTo(edgeX + (band.fromLeft ? skew : -skew), yTop);
  ctx.lineTo(edgeX, yBottom);
  ctx.lineTo(backX, yBottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Bright leading edge so the wipe reads like a TV sweep.
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  const stripe = 12 * (band.fromLeft ? 1 : -1);
  ctx.moveTo(edgeX + (band.fromLeft ? skew : -skew), yTop);
  ctx.lineTo(edgeX + (band.fromLeft ? skew : -skew) + stripe, yTop);
  ctx.lineTo(edgeX + stripe, yBottom);
  ctx.lineTo(edgeX, yBottom);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

/**
 * TV transition for `p` in [0,1]: two skewed bands sweep in from both sides, fully covering the
 * screen at p=0.5 (where the scene cut happens), then sweep back out; a white flash peaks at the cut.
 */
export function drawBroadcastWipe(ctx: CanvasRenderingContext2D, view: Size, dpr: number, p: number): void {
  const coverage = Math.sin(clamp(p, 0, 1) * Math.PI);
  if (coverage <= 0.001) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const midY = view.height / 2;
  drawBand(ctx, view, BANDS[0], coverage, 0, midY);
  drawBand(ctx, view, BANDS[1], coverage, midY, view.height);

  const flash = clamp(1 - Math.abs(p - 0.5) * 6, 0, 1) * 0.9;
  if (flash > 0.001) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, view.width, view.height);
  }
  ctx.restore();
}

/** Letterbox bars + a blinking REPLAY tag while the slow-mo replay is on screen. */
export function drawReplayDressing(ctx: CanvasRenderingContext2D, view: Size, dpr: number, now: number): void {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const barH = Math.round(view.height * LETTERBOX_RATIO);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
  ctx.fillRect(0, 0, view.width, barH);
  ctx.fillRect(0, view.height - barH, view.width, barH);

  const blinkOn = Math.sin((now / 1000) * Math.PI * 2 * TAG_BLINK_HZ) > -0.2;
  const alpha = blinkOn ? 1 : 0.35;
  const x = 24;
  const y = barH + 16;
  const w = 92;
  const h = 26;

  ctx.fillStyle = 'rgba(10, 10, 14, 0.72)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, 6);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(x + 15, y + h / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('R E P L A Y', x + 26, y + h / 2 + 1);
  ctx.restore();
}
