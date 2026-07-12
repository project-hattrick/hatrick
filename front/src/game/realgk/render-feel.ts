import { BodyAnim } from './enums';
import { ITEM_MAP } from './assets/items';
import type { RealGkAssets } from './assets/loader';
import { SIDE_MODES, drawComposedHead, drawTrimmedSprite, gkHead, spriteHeightForBase, type HeadBounds } from './composite';
import { keeperConfigFor } from './sim/keeper';
import type { RealGkPlayer, RealGkWorld } from './types';
import { clamp, lerp } from './util';

/** Crossfade window (seconds since the last keeper mode switch) over which the previous frame ghosts out. */
export const GHOST_WINDOW = 0.14;
/** Max horizontal skew (in x-units per drawn height) applied to a leaning keeper sprite. */
const LEAN_MAX_SKEW = 0.16;

/** Non-diving keeper locomotion frames eligible for the crossfade ghost (composited body+head). */
const GHOSTABLE = new Set<BodyAnim>([BodyAnim.GkIdle, BodyAnim.GkReady, BodyAnim.GkShuffle, BodyAnim.GkRunSide]);

export function isGhostable(mode: BodyAnim): boolean {
  return GHOSTABLE.has(mode);
}

/** Applies the lean skew transform around the keeper's foot point (call inside a ctx.save/restore). */
export function applyLeanTransform(ctx: CanvasRenderingContext2D, player: RealGkPlayer, footY: number): void {
  const skew = clamp(player.vx / 168, -1, 1) * LEAN_MAX_SKEW;
  ctx.translate(player.x, footY);
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.translate(-player.x, -footY);
}

/**
 * Draws a fading ghost of the keeper's PREVIOUS locomotion frame under the live sprite (feel.crossfade),
 * so a mode switch dissolves instead of snapping. Self-contained: it re-derives sizing/heads exactly like
 * the keeper path in render.ts, so it stays in sync without threading that path's locals through.
 */
export function drawKeeperGhost(
  ctx: CanvasRenderingContext2D,
  world: RealGkWorld,
  assets: RealGkAssets,
  player: RealGkPlayer,
  mode: BodyAnim,
  frameIdx: number,
  footY: number,
  depth: number,
  alpha: number,
  personaHeadScale: number,
  headBounds: HeadBounds | undefined,
): void {
  if (alpha <= 0.02 || !isGhostable(mode)) return;
  const personaOn = world.cfg.features?.personaHeads === true && assets.personaHeads.length > 0;
  const usePersona = personaOn && !!assets.personaBodies[mode]?.length;
  const frames = usePersona ? assets.personaBodies[mode] : assets.body[mode];
  const frame = frames?.[frameIdx] ?? frames?.[0];
  if (!frame || !frame.complete || !frame.naturalWidth) return;

  const headSet = personaOn ? assets.personaHeads[player.personaId % assets.personaHeads.length] : assets.heads;
  const cfg0 = keeperConfigFor(mode, 0);
  const cfg = keeperConfigFor(mode, frameIdx);
  const sizeCfg = personaHeadScale === 1 ? cfg0 : { ...cfg0, headScale: cfg0.headScale * personaHeadScale };
  const drawCfg = personaHeadScale === 1 ? cfg : { ...cfg, headScale: cfg.headScale * personaHeadScale };
  const base = lerp(world.cfg.spriteMinH, world.cfg.spriteMaxH, depth);
  const height = spriteHeightForBase(base, sizeCfg, world.cfg.features?.normalizedSizes === true);
  const bbox = usePersona ? [0, 0, frame.naturalWidth, frame.naturalHeight] : ITEM_MAP[mode]?.bboxes[frameIdx] ?? null;
  const mirror = SIDE_MODES.has(mode) ? player.facing < 0 : false;

  ctx.save();
  ctx.globalAlpha = alpha;
  const rect = drawTrimmedSprite(ctx, frame, bbox, player.x, footY, height, mirror);
  if (rect) drawComposedHead(ctx, headSet[gkHead(drawCfg.headView)], player.x, rect, mirror, drawCfg, headBounds);
  ctx.restore();
}
