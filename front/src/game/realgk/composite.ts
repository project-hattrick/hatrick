import { BodyAnim, HeadView } from './enums';
import type { FrameCfg } from './assets/configs';
import type { HeadKey } from './assets/loader';

/**
 * Single source of truth for the body+head compositing used by BOTH the in-match renderer (`render.ts`)
 * and the persona editor (`/sandbox/persona-editor`). Keep all sprite/head geometry here so the editor
 * reflects the game exactly — never re-implement this math elsewhere.
 */

export interface SpriteRect {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
  sourceW: number;
  sourceH: number;
}

/** Anims drawn in profile: the body sprite mirrors with the player's facing (and the side head with it). */
export const SIDE_MODES = new Set<BodyAnim>([
  BodyAnim.RunSide,
  BodyAnim.TurnSide,
  BodyAnim.GkRunSide,
  BodyAnim.GkDive,
  BodyAnim.GkDiveV2,
  BodyAnim.GkDiveCompact,
  BodyAnim.PowerShotSide,
  BodyAnim.SlideTackle,
  // Persona strike bodies are authored kicking RIGHT — mirror with facing so the swing matches where
  // the ball actually goes (startPowerShot faces the goal before locking the mode).
  BodyAnim.ShotFront,
  BodyAnim.ShotBack,
]);

/** Maps a composited-head view to the loaded head-set key. */
export const gkHead = (v: HeadView): HeadKey =>
  v === HeadView.Back ? 'back' : v === HeadView.Side ? 'side' : v === HeadView.FrontClosed ? 'frontClosed' : 'front';

/**
 * Drawn height for a composited actor from a base (far→near) height. With `normalizedSizes` the body is
 * shrunk so body+head TOGETHER read as `base`; otherwise the legacy per-anim `bodyScale` is used. `sizeScale`
 * (per-frame editor override) multiplies on top.
 */
export function spriteHeightForBase(base: number, frameCfg: FrameCfg | null, normalizedSizes: boolean): number {
  if (!frameCfg) return base;
  const sizeScale = frameCfg.sizeScale ?? 1;
  if (normalizedSizes) {
    return (base / Math.max(0.75, 1 + frameCfg.headScale - frameCfg.offsetYRatio)) * sizeScale;
  }
  return base * frameCfg.bodyScale * sizeScale;
}

/** Whole-sprite draw (head baked in), foot-anchored at (x, footY); mirrors horizontally when `mirror`. */
export function drawSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, footY: number, height: number, mirror: boolean): void {
  if (!image || !image.complete || !image.naturalWidth) return;
  const width = image.naturalWidth * (height / image.naturalHeight);
  const drawX = Math.round(x - width * 0.5);
  const drawY = Math.round(footY - height);
  if (mirror) {
    ctx.save();
    ctx.translate(drawX + width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, drawY, width, height);
    ctx.restore();
  } else {
    ctx.drawImage(image, drawX, drawY, width, height);
  }
}

/** Draws a (trimmed) body sprite to `visibleHeight`, foot-anchored; returns its screen rect for the head. */
export function drawTrimmedSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  bbox: number[] | null,
  x: number,
  footY: number,
  visibleHeight: number,
  mirror: boolean,
): SpriteRect | null {
  if (!image || !image.complete || !image.naturalWidth || !bbox) return null;
  const [left, top, right, bottom] = bbox;
  const sourceW = Math.max(1, right - left);
  const sourceH = Math.max(1, bottom - top);
  const scale = visibleHeight / sourceH;
  const drawW = sourceW * scale;
  const drawH = visibleHeight;
  const drawX = Math.round(x - drawW * 0.5);
  const drawY = Math.round(footY - drawH);
  if (mirror) {
    ctx.save();
    ctx.translate(drawX + drawW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, left, top, sourceW, sourceH, 0, drawY, drawW, drawH);
    ctx.restore();
  } else {
    ctx.drawImage(image, left, top, sourceW, sourceH, drawX, drawY, drawW, drawH);
  }
  return { drawX, drawY, drawW, drawH, sourceW, sourceH };
}

/**
 * Composites a head over a body rect per `frameCfg` (scale + offset ratios); mirrors side heads with facing.
 * `maxHeadHeight` (game-only runtime guard, see RealGkConfig.headMaxFraction) caps the drawn head so
 * per-frame headScale outliers can't balloon it — the editors omit it on purpose to show raw values.
 */
export function drawComposedHead(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  bodyRect: SpriteRect,
  mirror: boolean,
  frameCfg: FrameCfg,
  maxHeadHeight?: number,
): void {
  if (!image.complete || !image.naturalWidth) return;
  const headHeight = Math.min(bodyRect.drawH * frameCfg.headScale, maxHeadHeight ?? Infinity);
  const headWidth = image.naturalWidth * (headHeight / image.naturalHeight);
  const xShift = bodyRect.drawW * frameCfg.offsetXRatio * (mirror ? -1 : 1);
  const yOverlap = bodyRect.drawH * frameCfg.offsetYRatio;
  const drawX = Math.round(centerX - headWidth * 0.5 + xShift);
  const drawY = Math.round(bodyRect.drawY - headHeight + yOverlap);
  // Side heads mirror with body facing; headFlip flips the look direction on top of that (XOR).
  const shouldMirror = (mirror && frameCfg.headView === HeadView.Side) !== (frameCfg.headFlip ?? false);
  if (shouldMirror) {
    ctx.save();
    ctx.translate(drawX + headWidth, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, drawY, headWidth, headHeight);
    ctx.restore();
  } else {
    ctx.drawImage(image, drawX, drawY, headWidth, headHeight);
  }
}
