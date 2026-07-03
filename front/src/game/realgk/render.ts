import { BALL_GRAVITY, DIVE_LENGTH, FLAT_DEPTH, FLAT_SQUASH, REFEREE_SCALE } from './constants';
import { BodyAnim, CoachMode, HeadView, PlayerAction, RefMode, Role, Team } from './enums';
import { fieldBounds } from './field';
import type { RealGkPlayer, RealGkWorld } from './types';
import { clamp, lerp } from './util';
import type { RealGkCamera } from './camera';
import { outfieldConfigFor, type FrameCfg } from './assets/configs';
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

const SIDE_MODES = new Set<BodyAnim>([BodyAnim.RunSide, BodyAnim.TurnSide, BodyAnim.GkRunSide, BodyAnim.GkDive, BodyAnim.PowerShotSide]);

/** Team-colored foot ring (matches v1). */
const TEAM_RING: Record<Team, string> = { [Team.Blue]: '#3b82f6', [Team.Red]: '#ef4444' };

const gkHead = (v: HeadView): HeadKey =>
  v === HeadView.Back ? 'back' : v === HeadView.Side ? 'side' : v === HeadView.FrontClosed ? 'frontClosed' : 'front';

/**
 * Actor height at `depth`. With `normalizedSizes` a composited body is shrunk so body+head together
 * read as the base height (playground rule); legacy path keeps the keeper's hand-tuned bodyScale.
 */
function spriteHeightFor(world: RealGkWorld, depth: number, frameCfg: FrameCfg | null): number {
  const base = lerp(world.cfg.spriteMinH, world.cfg.spriteMaxH, depth);
  if (!frameCfg) return base;
  const sizeScale = frameCfg.sizeScale ?? 1;
  if (world.cfg.features?.normalizedSizes) {
    return (base / Math.max(0.75, 1 + frameCfg.headScale - frameCfg.offsetYRatio)) * sizeScale;
  }
  return base * frameCfg.bodyScale * sizeScale;
}

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
  const height = lerp(world.cfg.spriteMinH, world.cfg.spriteMaxH, depth) * (world.cfg.actorScale?.referee ?? REFEREE_SCALE);

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
  const outfieldCfg = isGk ? null : outfieldConfigFor(player.mode, frameIdx, player.celebrationPhase);
  const diving = isGk && player.action === PlayerAction.Dive;
  // Size off the anim's first-frame config so per-frame head offsets never pulse the body height.
  const sizeCfg = keeperCfg ?? outfieldCfg ? (isGk ? keeperConfigFor(player.mode, 0) : outfieldConfigFor(player.mode, 0, player.celebrationPhase)) : null;
  // The dive is a horizontal pose: normalize its LONGEST side (usually width) to the standing height so
  // the stretched sprite reads like a normal player instead of inflating off its short height.
  const diveBox = diving ? modeItem?.bboxes[frameIdx] : null;
  const spriteHeight = diveBox
    ? (lerp(world.cfg.spriteMinH, world.cfg.spriteMaxH, depth) * DIVE_LENGTH) /
      Math.max(1, (diveBox[2] - diveBox[0]) / Math.max(1, diveBox[3] - diveBox[1]))
    : spriteHeightFor(world, depth, sizeCfg);
  const footY = player.y - player.celebrationLift;

  // Foot shadow (with per-player variety + a stretch along movement) and a glowing team ring.
  const liftShrink = 1 - Math.min(0.38, player.celebrationLift / 60);
  const spd = Math.hypot(player.vx, player.vy);
  const vary = 0.9 + ((player.id * 37) % 21) / 100; // stable 0.9–1.1 size variety per player
  const stretch = diving ? 1.35 : 1 + Math.min(0.45, spd / 280);
  const shadowRX = lerp(8, 15, depth) * stretch * vary * liftShrink;
  const shadowRY = lerp(3, 6, depth) * (diving ? 1 : 1 / Math.sqrt(stretch)) * vary * liftShrink;
  const cy = player.y + 5;
  const shadowAlpha = ((diving ? 0.34 : 0.28) - Math.min(0.14, player.celebrationLift * 0.004)) * liftShrink;

  // Composited/plain sprite painter — reused for the mirrored reflection and the real draw.
  const mirror = sideMode ? player.facing < 0 : false;
  const composedCfg = keeperCfg ?? outfieldCfg;
  const paintSprite = (): void => {
    if (composedCfg) {
      const bbox = modeItem?.bboxes[frameIdx] ?? (frame.complete && frame.naturalWidth ? [0, 0, frame.naturalWidth, frame.naturalHeight] : null);
      const bodyRect = drawTrimmedSprite(ctx, frame, bbox, player.x, footY, spriteHeight, mirror);
      if (bodyRect) drawComposedHead(ctx, assets.heads[gkHead(composedCfg.headView)], player.x, bodyRect, mirror, composedCfg);
    } else {
      drawSprite(ctx, frame, player.x, footY, spriteHeight, mirror);
    }
  };

  // Reflection: a flipped, squashed, faded copy under the feet (wet-turf sheen). Skipped when airborne.
  if (player.celebrationLift < 2) {
    ctx.save();
    ctx.globalAlpha = 0.14 * (diving ? 0.6 : 1);
    ctx.translate(0, footY);
    ctx.scale(1, -0.5);
    ctx.translate(0, -footY);
    paintSprite();
    ctx.restore();
  }

  // Radial-gradient shadow squashed to an ellipse — reads rounder/softer than a flat fill.
  ctx.save();
  ctx.translate(player.x, cy);
  ctx.scale(1, Math.max(0.001, shadowRY / shadowRX));
  const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowRX);
  shadowGrad.addColorStop(0, `rgba(0,0,0,${shadowAlpha})`);
  shadowGrad.addColorStop(0.6, `rgba(0,0,0,${shadowAlpha * 0.5})`);
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, shadowRX, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Team ring: a soft wide glow underneath + a crisp bright line on top.
  const ringRX = shadowRX + lerp(3, 5, depth);
  const ringRY = shadowRY + lerp(1.6, 2.6, depth);
  ctx.save();
  ctx.strokeStyle = TEAM_RING[player.team];
  ctx.globalAlpha = 0.3 * liftShrink;
  ctx.lineWidth = Math.max(3, lerp(3, 5.5, depth));
  ctx.beginPath();
  ctx.ellipse(player.x, cy, ringRX, ringRY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.95 * liftShrink;
  ctx.lineWidth = Math.max(1.3, lerp(1.3, 2, depth));
  ctx.beginPath();
  ctx.ellipse(player.x, cy, ringRX, ringRY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  paintSprite();
}

function drawBall(ctx: CanvasRenderingContext2D, world: RealGkWorld, assets: RealGkAssets, flat: boolean): void {
  const { ball, size } = world;
  const bounds = fieldBounds(size, ball.y);
  const depth = flat ? FLAT_DEPTH : bounds.depth;
  const ballScale = world.cfg.ballScale ?? 1;
  // Soft radial shadow that shrinks + fades as the ball rises (reads as real height).
  const shadowW = lerp(10, 22, depth) * (1 - Math.min(ball.z, 90) / 180) * ballScale;
  const shadowH = lerp(4, 8, depth) * (1 - Math.min(ball.z, 90) / 260) * ballScale;
  const sAlpha = clamp(0.3 - ball.z * 0.002, 0.06, 0.3);
  ctx.save();
  ctx.translate(ball.x, ball.y + 4);
  ctx.scale(1, Math.max(0.001, shadowH / shadowW));
  const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowW);
  bg.addColorStop(0, `rgba(0,0,0,${sAlpha})`);
  bg.addColorStop(0.6, `rgba(0,0,0,${sAlpha * 0.5})`);
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, shadowW, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // v1 ball animation: speed-band + roll-phase frames, squashed sprite on impact.
  const frameIdx = ball.impact > 0.01 ? BALL_IMPACT_FRAME : v1BallFrameIndex(Math.hypot(ball.vx, ball.vy), ball.spin);
  const frame = assets.ball[frameIdx];
  if (!frame.complete || !frame.naturalWidth) return;
  const px = lerp(10, 18, depth) * (1 + Math.min(ball.z, 90) * 0.0018) * ballScale;
  const aspect = frame.naturalWidth / Math.max(1, frame.naturalHeight);
  const aspectScale = Math.sqrt(aspect);
  const drawW = Math.round(px * aspectScale);
  const drawH = Math.round(px / aspectScale);
  ctx.drawImage(frame, Math.round(ball.x - drawW * 0.5), Math.round(ball.y - ball.z - drawH * 0.5), drawW, drawH);
}

function drawCoach(ctx: CanvasRenderingContext2D, world: RealGkWorld, assets: RealGkAssets): void {
  const c = world.coach;
  const spriteHeight = lerp(world.cfg.spriteMinH, world.cfg.spriteMaxH, c.depth) * (world.cfg.actorScale?.coach ?? 1.06);
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

/** Late-afternoon stadium shadow: a cool dark band covering ~half the pitch that slowly creeps across. */
function drawDuskShadow(ctx: CanvasRenderingContext2D, world: RealGkWorld, now: number): void {
  if (!world.cfg.features?.duskShadow) return;
  const { width, height } = world.size;
  const edge = clamp(0.4 + now * 0.0000016, 0.4, 0.62) * width; // creeps from ~40% to ~62% over the match
  const soft = width * 0.16;
  const grad = ctx.createLinearGradient(0, 0, edge, 0);
  grad.addColorStop(0, 'rgba(16,20,42,0.36)');
  grad.addColorStop(Math.max(0, 1 - soft / Math.max(1, edge)), 'rgba(16,20,42,0.36)');
  grad.addColorStop(1, 'rgba(16,20,42,0)');
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, edge, height);
  ctx.restore();
}

/** Predicted landing spot of a lofted ball — a ground shadow + a white "×2.5" target on the pitch. */
function drawLandingMarker(ctx: CanvasRenderingContext2D, world: RealGkWorld): void {
  const { ball } = world;
  if (ball.ownerId != null || (ball.z < 14 && ball.vz < 60)) return;
  const t = (ball.vz + Math.sqrt(Math.max(0, ball.vz * ball.vz + 2 * BALL_GRAVITY * ball.z))) / BALL_GRAVITY;
  if (t < 0.2) return;
  const lx = ball.x + ball.vx * t;
  const ly = ball.y + ball.vy * t;

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(lx, ly, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  const s = 7;
  ctx.beginPath();
  ctx.moveTo(lx - s, ly - s * 0.55);
  ctx.lineTo(lx + s, ly + s * 0.55);
  ctx.moveTo(lx + s, ly - s * 0.55);
  ctx.lineTo(lx - s, ly + s * 0.55);
  ctx.stroke();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('×2.5', lx + 11, ly - 6);
  ctx.restore();
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
  drawLandingMarker(ctx, world);

  const renderables: { sortY: number; draw: () => void }[] = world.players.map((player) => ({
    sortY: player.y,
    draw: () => drawPlayer(ctx, player, world, assets, now, flat),
  }));
  renderables.push({ sortY: world.coach.y, draw: () => drawCoach(ctx, world, assets) });
  if (world.referee.active) {
    renderables.push({ sortY: world.referee.y, draw: () => drawReferee(ctx, world, assets, now, flat) });
  }
  // A dribbled ball sits at the owner's foot — always sort it just in front of him so his body
  // never hides it ("ball behind the player"). Loose/airborne balls use their own y (with z lift).
  const ballOwner = world.ball.ownerId != null ? world.players.find((p) => p.id === world.ball.ownerId) : null;
  const ballSortY = ballOwner ? ballOwner.y + 6 : world.ball.y + (world.ball.z > 0 ? -18 : 0);
  renderables.push({ sortY: ballSortY, draw: () => drawBall(ctx, world, assets, flat) });

  renderables.sort((a, b) => a.sortY - b.sortY).forEach((r) => r.draw());

  // Dusk shadow darkens the grass + anyone standing in the covered half (drawn over the scene).
  drawDuskShadow(ctx, world, now);
}
