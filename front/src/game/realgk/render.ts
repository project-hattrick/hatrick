import { FLAT_DEPTH, FLAT_SQUASH, REFEREE_SCALE } from './constants';
import { BodyAnim, CoachMode, HeadView, PlayerAction, RefMode, Role, Team } from './enums';
import { fieldBounds } from './field';
import type { RealGkPlayer, RealGkWorld } from './types';
import { clamp, lerp } from './util';
import type { RealGkCamera } from './camera';
import type { FrameCfg } from './assets/configs';
import { ITEM_MAP } from './assets/items';
import type { HeadKey, RealGkAssets, RefereeSprites } from './assets/loader';
import { BALL_IMPACT_FRAME, ballFrameIndex as v1BallFrameIndex } from '../assets/manifest';
import { keeperConfigFor } from './sim/keeper';
import { frameIndexFor } from './sim/players';

interface SpriteRect {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
  sourceW: number;
  sourceH: number;
}

const SIDE_MODES = new Set<BodyAnim>([BodyAnim.RunSide, BodyAnim.GkRunSide, BodyAnim.GkDive]);

/** Team-colored foot ring (matches v1). */
const TEAM_RING: Record<Team, string> = { [Team.Blue]: '#3b82f6', [Team.Red]: '#ef4444' };

const gkHead = (v: HeadView): HeadKey => (v === HeadView.Back ? 'back' : v === HeadView.Side ? 'side' : 'front');

function drawSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, footY: number, height: number, mirror: boolean): void {
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

function drawTrimmedSprite(
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

function drawComposedHead(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  bodyRect: SpriteRect,
  mirror: boolean,
  frameCfg: FrameCfg,
): void {
  if (!image.complete || !image.naturalWidth) return;
  const headHeight = bodyRect.drawH * frameCfg.headScale;
  const headWidth = image.naturalWidth * (headHeight / image.naturalHeight);
  const xShift = bodyRect.drawW * frameCfg.offsetXRatio * (mirror ? -1 : 1);
  const yOverlap = bodyRect.drawH * frameCfg.offsetYRatio;
  const drawX = Math.round(centerX - headWidth * 0.5 + xShift);
  const drawY = Math.round(bodyRect.drawY - headHeight + yOverlap);
  if (mirror && frameCfg.headView === HeadView.Side) {
    ctx.save();
    ctx.translate(drawX + headWidth, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, drawY, headWidth, headHeight);
    ctx.restore();
  } else {
    ctx.drawImage(image, drawX, drawY, headWidth, headHeight);
  }
}

/** Whole-sprite referee (v2): idle 3/4, side-walk cycle, or red card — head embedded, no compositing. */
function refereeImage(ref: RefereeSprites, mode: RefMode, elapsed: number, now: number): HTMLImageElement {
  if (mode === RefMode.Red) return ref.redFront;
  if (mode === RefMode.WalkSide || mode === RefMode.Walk) {
    return ref.walkSide[Math.floor((elapsed || now / 1000) * 7.2) % ref.walkSide.length];
  }
  return ref.idleQuarter;
}

function drawReferee(ctx: CanvasRenderingContext2D, world: RealGkWorld, assets: RealGkAssets, now: number, flat: boolean): void {
  const { referee, size } = world;
  if (!referee.active) return;
  const depth = flat ? FLAT_DEPTH : fieldBounds(size, referee.y).depth;
  const height = lerp(world.cfg.spriteMinH, world.cfg.spriteMaxH, depth) * REFEREE_SCALE;

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(referee.x, referee.y + 4, lerp(10, 14, clamp(depth + 0.08, 0, 0.2)), 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawSprite(ctx, refereeImage(assets.ref, referee.mode, referee.elapsed, now), referee.x, referee.y, height, referee.mirror);
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: RealGkPlayer, world: RealGkWorld, assets: RealGkAssets, now: number, flat: boolean): void {
  const { size } = world;
  const bounds = fieldBounds(size, player.y);
  const depth = flat ? FLAT_DEPTH : bounds.depth;
  const frameIdx = frameIndexFor(player, now);
  const modeItem = ITEM_MAP[player.mode];
  const frame = assets.body[player.mode][frameIdx];
  const sideMode = SIDE_MODES.has(player.mode);
  const isGk = player.role === Role.GK;
  const keeperCfg = isGk ? keeperConfigFor(player.mode, frameIdx) : null;
  const diving = isGk && player.action === PlayerAction.Dive;
  const spriteHeight = lerp(world.cfg.spriteMinH, world.cfg.spriteMaxH, depth) * (keeperCfg ? keeperCfg.bodyScale : 1);

  // Small foot shadow with the team ring encircling it (concentric, ring sits just outside the shadow).
  const shadowRX = lerp(8, 15, depth) * (diving ? 1.14 : 1);
  const shadowRY = lerp(3, 6, depth);
  const cy = player.y + 5;

  ctx.save();
  ctx.globalAlpha = diving ? 0.26 : 0.2;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(player.x, cy, shadowRX, shadowRY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = TEAM_RING[player.team];
  ctx.lineWidth = Math.max(1.4, lerp(1.4, 2.4, depth));
  ctx.beginPath();
  ctx.ellipse(player.x, cy, shadowRX + lerp(3, 5, depth), shadowRY + lerp(1.6, 2.6, depth), 0, 0, Math.PI * 2);
  ctx.stroke();

  const mirror = sideMode ? player.facing < 0 : false;
  if (isGk && keeperCfg) {
    const bodyRect = drawTrimmedSprite(ctx, frame, modeItem?.bboxes[frameIdx] ?? null, player.x, player.y, spriteHeight, mirror);
    if (bodyRect) {
      drawComposedHead(ctx, assets.heads[gkHead(keeperCfg.headView)], player.x, bodyRect, mirror, keeperCfg);
    }
  } else {
    drawSprite(ctx, frame, player.x, player.y, spriteHeight, mirror);
  }
}

function drawBall(ctx: CanvasRenderingContext2D, world: RealGkWorld, assets: RealGkAssets, flat: boolean): void {
  const { ball, size } = world;
  const bounds = fieldBounds(size, ball.y);
  const depth = flat ? FLAT_DEPTH : bounds.depth;
  const shadowW = lerp(10, 22, depth) * (1 - Math.min(ball.z, 90) / 180);
  const shadowH = lerp(4, 8, depth);
  ctx.save();
  ctx.globalAlpha = clamp(0.28 - ball.z * 0.002, 0.08, 0.28);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(ball.x, ball.y + 4, shadowW, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // v1 ball animation: speed-band + roll-phase frames, squashed sprite on impact.
  const frameIdx = ball.impact > 0.01 ? BALL_IMPACT_FRAME : v1BallFrameIndex(Math.hypot(ball.vx, ball.vy), ball.spin);
  const frame = assets.ball[frameIdx];
  if (!frame.complete || !frame.naturalWidth) return;
  const px = lerp(10, 18, depth) * (1 + Math.min(ball.z, 90) * 0.0018);
  const aspect = frame.naturalWidth / Math.max(1, frame.naturalHeight);
  const aspectScale = Math.sqrt(aspect);
  const drawW = Math.round(px * aspectScale);
  const drawH = Math.round(px / aspectScale);
  ctx.drawImage(frame, Math.round(ball.x - drawW * 0.5), Math.round(ball.y - ball.z - drawH * 0.5), drawW, drawH);
}

function drawCoach(ctx: CanvasRenderingContext2D, world: RealGkWorld, assets: RealGkAssets): void {
  const c = world.coach;
  const spriteHeight = lerp(world.cfg.spriteMinH, world.cfg.spriteMaxH, c.depth) * 1.06;
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 5, lerp(14, 23, c.depth), lerp(5, 8, c.depth), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const image = c.mode === CoachMode.Angry ? assets.coach.angry : assets.coach.idle;
  drawSprite(ctx, image, c.x, c.y, spriteHeight, false);
}

/** Paints the v1 court background under the follow-camera transform, then depth-sorts players/ref/ball. */
export function render(ctx: CanvasRenderingContext2D, world: RealGkWorld, assets: RealGkAssets, cam: RealGkCamera, now: number, flat = false): void {
  const { width, height } = world.size;
  const dpr = world.dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const z = cam.z;
  // 2D mode squashes the scene vertically around the camera so the trapezoid pitch reads shallower.
  const zy = z * (flat ? FLAT_SQUASH : 1);
  // Center on the viewport (screen), but paint the court at the full virtual-pitch size.
  ctx.setTransform(dpr * z, 0, 0, dpr * zy, dpr * (world.view.width / 2 - cam.x * z), dpr * (world.view.height / 2 - cam.y * zy));
  if (assets.court.complete && assets.court.naturalWidth) ctx.drawImage(assets.court, 0, 0, width, height);

  const renderables: { sortY: number; draw: () => void }[] = world.players.map((player) => ({
    sortY: player.y,
    draw: () => drawPlayer(ctx, player, world, assets, now, flat),
  }));
  renderables.push({ sortY: world.coach.y, draw: () => drawCoach(ctx, world, assets) });
  if (world.referee.active) {
    renderables.push({ sortY: world.referee.y, draw: () => drawReferee(ctx, world, assets, now, flat) });
  }
  renderables.push({ sortY: world.ball.y + (world.ball.z > 0 ? -18 : 0), draw: () => drawBall(ctx, world, assets, flat) });

  renderables.sort((a, b) => a.sortY - b.sortY).forEach((r) => r.draw());
}
