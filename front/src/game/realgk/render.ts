import { DIVE_LENGTH, FLAT_DEPTH, FLAT_SQUASH, REFEREE_SCALE } from './constants';
import { BodyAnim, CoachMode, HeadView, PlayerAction, RefMode, Role, Team } from './enums';
import { fieldBounds, GOALS, metrics } from './field';
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

  const liftShrink = 1 - Math.min(0.38, player.celebrationLift / 60);
  const spd = Math.hypot(player.vx, player.vy);
  const vary = 0.9 + ((player.id * 37) % 21) / 100; // stable 0.9–1.1 size variety per player
  const stretch = diving ? 1.35 : 1 + Math.min(0.45, spd / 280);
  const shadowRX = lerp(8, 15, depth) * stretch * vary * liftShrink;
  const shadowRY = lerp(3, 6, depth) * (diving ? 1 : 1 / Math.sqrt(stretch)) * vary * liftShrink;
  const cy = player.y + 5;
  const shadowAlpha = ((diving ? 0.42 : 0.34) - Math.min(0.2, player.celebrationLift * 0.006)) * liftShrink;

  // Sprite painter reused for the cast-shadow silhouette and the real draw.
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

  // Cast-shadow "reflection": the sprite as a solid BLACK silhouette, flipped down from the feet,
  // stretched + skewed to read like a long shadow on the pitch.
  if (player.celebrationLift < 2 && !diving) {
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.filter = 'brightness(0)';
    ctx.translate(player.x, footY);
    ctx.transform(1, 0, 0.62, -1.25, 0, 0); // skewX + flip & stretch downward
    ctx.translate(-player.x, -footY);
    paintSprite();
    ctx.restore();
  }

  // Small solid foot shadow to ground the sprite, plus the glowing team ring.
  ctx.save();
  ctx.globalAlpha = Math.max(0, shadowAlpha);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(player.x, cy, shadowRX, shadowRY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

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

  // Active-player marker (sandbox): a pulsing SOLID ring drawn in crisp pixel blocks + an inner glow.
  const isActive = world.cfg.features?.playable === true && world.controlId === player.id;
  if (isActive) {
    const pulse = (Math.sin(now * 0.005) + 1) / 2;
    const rr = ringRX + 1 + pulse * 3;
    const ry = ringRY + 0.6 + pulse * 1.3;
    ctx.save();
    ctx.fillStyle = '#4fe6d4';
    ctx.globalAlpha = 0.22; // inner glow
    ctx.beginPath();
    ctx.ellipse(player.x, cy, Math.max(1, rr - 2), Math.max(0.6, ry - 1), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    const steps = Math.max(22, Math.round(rr * 3.2)); // dense 2px blocks → pixel "solid" ring
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const dx = Math.round(player.x + Math.cos(a) * rr);
      const dy = Math.round(cy + Math.sin(a) * ry);
      ctx.fillRect(dx - 1, dy - 1, 2, 2);
    }
    ctx.restore();
  }

  paintSprite();

  // Overhead pixel arrow (built from stacked rects) bobbing above the controlled player.
  if (isActive) {
    const ax = Math.round(player.x);
    const ay = Math.round(footY - spriteHeight - 9 + (Math.floor(now / 180) % 3) - 1);
    ctx.save();
    ctx.fillStyle = '#4fe6d4';
    ctx.fillRect(ax - 4, ay, 9, 2);
    ctx.fillRect(ax - 3, ay + 2, 7, 2);
    ctx.fillRect(ax - 2, ay + 4, 5, 2);
    ctx.fillRect(ax - 1, ay + 6, 3, 2);
    ctx.restore();
  }
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

// Goal-net placement knobs (tune to the pitch): height vs the goal-mouth band, nudge off the line, and
// which way the source art's opening faces (left goal uses it as-is, right goal mirrors it).
const GOAL_H_SCALE = 1.7;
const GOAL_X_OFF = 6;
const GOAL_Y_OFF = 0;

/** Draws one depth layer of the goal net at both goal lines (aligned to field.ts GOALS). */
function drawGoalNet(ctx: CanvasRenderingContext2D, world: RealGkWorld, assets: RealGkAssets, layer: 'back' | 'front'): void {
  if (!world.cfg.features?.goalNet) return;
  const img = layer === 'back' ? assets.goal.back : assets.goal.front;
  if (!img.complete || !img.naturalWidth) return;
  const m = metrics(world.size);
  const aspect = img.naturalWidth / img.naturalHeight;
  for (const team of [Team.Blue, Team.Red]) {
    const g = GOALS[team];
    const midD = (g.depthTop + g.depthBottom) / 2;
    const yTop = lerp(m.topY, m.bottomY, g.depthTop);
    const yBottom = lerp(m.topY, m.bottomY, g.depthBottom);
    const H = (yBottom - yTop) * GOAL_H_SCALE;
    const W = H * aspect;
    const y = (yTop + yBottom) / 2 - H / 2 + GOAL_Y_OFF;
    const left = g.lat < 0.5;
    const lineX = left ? lerp(m.topLeft, m.bottomLeft, midD) : lerp(m.topRight, m.bottomRight, midD);
    ctx.save();
    if (left) {
      ctx.drawImage(img, lineX - W + GOAL_X_OFF, y, W, H); // extends outward (left), opening faces the pitch
    } else {
      ctx.translate(lineX - GOAL_X_OFF + W, 0); // mirror for the right goal
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, y, W, H);
    }
    ctx.restore();
  }
}

/** Fixed, dispersed diagonal shadow beams with soft (blurred) edges — reads like cast stadium shadows. */
function drawShadowBeams(ctx: CanvasRenderingContext2D, world: RealGkWorld): void {
  if (!world.cfg.features?.duskShadow) return;
  const { width, height } = world.size;
  const gap = height * 0.62; // dispersed
  const bw = height * 0.22;
  const skew = height * 0.55;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#0a1030';
  ctx.filter = 'blur(7px)'; // soft fade like a real shadow
  for (let x = -height; x < width + height; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + bw, 0);
    ctx.lineTo(x + bw - skew, height);
    ctx.lineTo(x - skew, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Predicted landing spot of a lofted ball — a ground shadow + a white "×2.5" target on the pitch. */
function drawLandingMarker(ctx: CanvasRenderingContext2D, world: RealGkWorld): void {
  const { ball } = world;
  // Only for lofted balls (crosses / long balls); fixed spot computed at the cross, up the whole flight.
  if (ball.ownerId != null || !ball.lofted || ball.z < 3) return;
  const lx = ball.landX;
  const ly = ball.landY;

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(lx, ly, 6, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  const s = 4;
  ctx.beginPath();
  ctx.moveTo(lx - s, ly - s * 0.55);
  ctx.lineTo(lx + s, ly + s * 0.55);
  ctx.moveTo(lx + s, ly - s * 0.55);
  ctx.lineTo(lx - s, ly + s * 0.55);
  ctx.stroke();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 8px system-ui, sans-serif';
  ctx.fillText('×2.5', lx + 7, ly - 4);
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
  drawGoalNet(ctx, world, assets, 'back'); // behind the players

  const renderables: { sortY: number; draw: () => void }[] = world.players.map((player) => ({
    sortY: player.y,
    draw: () => drawPlayer(ctx, player, world, assets, now, flat),
  }));
  renderables.push({ sortY: world.coach.y, draw: () => drawCoach(ctx, world, assets) });
  if (world.referee.active) {
    renderables.push({ sortY: world.referee.y, draw: () => drawReferee(ctx, world, assets, now, flat) });
  }
  // A dribbled ball sits at the owner's foot: sort it in front when he faces the camera, behind when he
  // faces away (back to us) so the body correctly occludes it. Loose/airborne balls use their own y.
  const ballOwner = world.ball.ownerId != null ? world.players.find((p) => p.id === world.ball.ownerId) : null;
  const facingAway = ballOwner ? ballOwner.lookY < -0.25 || ballOwner.mode.includes('back') : false;
  const ballSortY = ballOwner ? ballOwner.y + (facingAway ? -10 : 6) : world.ball.y + (world.ball.z > 0 ? -18 : 0);
  renderables.push({ sortY: ballSortY, draw: () => drawBall(ctx, world, assets, flat) });

  renderables.sort((a, b) => a.sortY - b.sortY).forEach((r) => r.draw());
  drawGoalNet(ctx, world, assets, 'front'); // near posts/net over the players

  // Fixed diagonal shadow beams over the whole scene.
  drawShadowBeams(ctx, world);
}
