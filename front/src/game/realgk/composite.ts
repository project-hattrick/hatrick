import { BodyAnim, HeadView } from './enums';
import type { FrameCfg } from './assets/configs';
import type { HeadKey } from './assets/loader';
import { DIVE2_HEIGHT_RATIO } from './sim/keeper';

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

/**
 * Per-frame drawn-height ratio for the v6 dive. Family packs (pre-trimmed frames, e.g. /game/franca)
 * keep a constant source-pixel scale — each frame's own height vs the standing frame 0 — so no pose can
 * shrink or balloon regardless of how the cuts were trimmed. The baked candidate_01 pack (no per-frame
 * images passed) keeps its approved hand-tuned DIVE2_HEIGHT_RATIO.
 */
export function dive2HeightRatio(frameIdx: number, frame?: HTMLImageElement | null, frame0?: HTMLImageElement | null): number {
  if (frame?.complete && frame.naturalHeight && frame0?.complete && frame0.naturalHeight) {
    return frame.naturalHeight / frame0.naturalHeight;
  }
  return DIVE2_HEIGHT_RATIO[frameIdx] ?? 1;
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

/** Runtime clamp for a composited head's drawn height (game-only, see RealGkConfig.head*Fraction). */
export interface HeadBounds {
  min?: number;
  max?: number;
}

/** Head pixel height for a body rect under the optional bounds — shared by the draw and hit-rect math. */
export function composedHeadHeight(bodyRect: SpriteRect, frameCfg: FrameCfg, bounds?: HeadBounds): number {
  return Math.min(Math.max(bodyRect.drawH * frameCfg.headScale, bounds?.min ?? 0), bounds?.max ?? Infinity);
}

/**
 * Composites a head over a body rect per `frameCfg` (scale + offset ratios); mirrors side heads with facing.
 * `bounds` (game-only runtime guard, see RealGkConfig.headMaxFraction/headMinFraction) clamps the drawn
 * head so per-frame headScale outliers can't balloon it and short-drawn bodies (slide tackle) can't
 * shrink it — the editors omit it on purpose to show raw values.
 */
export function drawComposedHead(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  bodyRect: SpriteRect,
  mirror: boolean,
  frameCfg: FrameCfg,
  bounds?: HeadBounds,
): void {
  if (!image.complete || !image.naturalWidth) return;
  const headHeight = composedHeadHeight(bodyRect, frameCfg, bounds);
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
