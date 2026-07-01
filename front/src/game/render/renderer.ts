import { FrameMode, pickFrameIndex } from '../assets/animation';
import { BALL_IMPACT_FRAME, ballFrameIndex } from '../assets/manifest';
import type { Animation, GoalkeeperSet, OutfieldSet, SpriteSets } from '../assets/types';
import { CANVAS, PLAYER_SCALE } from '../core/constants';
import type { Ball, Player, ProjectFn, World } from '../core/types';
import { GoalkeeperAnim, OutfieldAnim, Role, Team } from '../enums';
import { speed } from '../math/geometry';
import type { View } from './camera';

const CW = CANVAS.width;
const CH = CANVAS.height;
const BG = '#06222f';
const PITCH_FALLBACK = '#163c2d';

const TEAM_COLOR: Record<Team, string> = { [Team.Blue]: '#3b82f6', [Team.Red]: '#ef4444' };

interface Selection {
  anim: Animation;
  flip: boolean;
  mode: FrameMode;
  start: number;
}

function outfieldSelection(p: Player, set: OutfieldSet, tick: number): Selection {
  const flip = p.faceX < 0;
  if (p.slideUntil > tick) return { anim: set[OutfieldAnim.Tackle], flip, mode: FrameMode.OneShot, start: p.slideStart };
  if (p.kickUntil > tick) return { anim: set[OutfieldAnim.Kick], flip, mode: FrameMode.OneShot, start: p.kickStart };
  if (p.celUntil > tick) return { anim: set[OutfieldAnim.Celebrate], flip: false, mode: FrameMode.Loop, start: 0 };
  if (speed(p) < 0.35) return { anim: set[OutfieldAnim.Idle], flip, mode: FrameMode.Loop, start: 0 };
  return { anim: set[OutfieldAnim.Run], flip, mode: FrameMode.Locomotion, start: 0 };
}

function goalkeeperSelection(p: Player, set: GoalkeeperSet, tick: number): Selection {
  const flip = p.faceX < 0;
  if (p.diveUntil > tick) return { anim: set[GoalkeeperAnim.DiveFull], flip, mode: FrameMode.OneShot, start: p.diveStart };
  if (p.gkKickUntil > tick) return { anim: set[GoalkeeperAnim.GoalKick], flip, mode: FrameMode.OneShot, start: p.gkKickStart };
  if (p.catchUntil > tick) return { anim: set[GoalkeeperAnim.CatchHigh], flip, mode: FrameMode.OneShot, start: p.catchStart };
  if (speed(p) < 1.0) return { anim: set[GoalkeeperAnim.Ready], flip, mode: FrameMode.Loop, start: 0 };
  return { anim: speed(p) > 3 ? set[GoalkeeperAnim.Run] : set[GoalkeeperAnim.Shuffle], flip, mode: FrameMode.Locomotion, start: 0 };
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, project: ProjectFn, assets: SpriteSets, tick: number): void {
  const pr = project(p.x, p.y);
  const gk = p.role === Role.GK;
  const s = PLAYER_SCALE * pr.scale;
  const sel = gk ? goalkeeperSelection(p, assets.goalkeeper, tick) : outfieldSelection(p, assets.outfield[p.team], tick);

  if (!gk) {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ellipse(ctx, pr.x, pr.y, 7 * pr.scale, 2.6 * pr.scale);
    ctx.fill();
  }
  ctx.strokeStyle = TEAM_COLOR[p.team];
  ctx.lineWidth = Math.max(1.1, 1.8 * pr.scale);
  ellipse(ctx, pr.x, pr.y, 7 * pr.scale, 2.6 * pr.scale);
  ctx.stroke();

  const { anim } = sel;
  const idx = pickFrameIndex(sel.mode, {
    len: anim.images.length,
    step: anim.step,
    tick,
    start: sel.start,
    phase: p.phase,
  });
  const f = anim.images[idx];
  if (f && f.complete && f.naturalWidth) {
    const w = f.naturalWidth * s * anim.scale;
    const h = f.naturalHeight * s * anim.scale;
    ctx.save();
    ctx.translate(pr.x, pr.y);
    ctx.scale(sel.flip ? -1 : 1, 1);
    ctx.drawImage(f, -w / 2, -h + 3 * pr.scale, w, h);
    ctx.restore();
  }
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, project: ProjectFn, assets: SpriteSets, tick: number): void {
  const pr = project(ball.x, ball.y);
  const s = pr.scale;
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ellipse(ctx, pr.x, pr.y, 3 * s, 1.5 * s);
  ctx.fill();
  const useImpact = ball.impact > tick && ball.z < 2;
  const idx = useImpact ? BALL_IMPACT_FRAME : ballFrameIndex(speed(ball) * 60, ball.roll);
  const f = assets.ball[idx];
  if (f && f.complete && f.naturalWidth) {
    const d = 5.5 * s;
    ctx.drawImage(f, pr.x - d / 2, pr.y - ball.z * s - d, d, d);
  }
}

/** Draws the pitch + depth-sorted players/ball inside the camera transform. */
export function renderScene(ctx: CanvasRenderingContext2D, world: World, assets: SpriteSets, project: ProjectFn, view: View): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CW, CH);

  ctx.save();
  ctx.setTransform(view.z, 0, 0, view.z, view.originX, view.originY);
  if (assets.stadium.complete && assets.stadium.naturalWidth) ctx.drawImage(assets.stadium, 0, 0, CW, CH);
  else {
    ctx.fillStyle = PITCH_FALLBACK;
    ctx.fillRect(0, 0, CW, CH);
  }

  const entities: { y: number; draw: () => void }[] = world.players.map((p) => ({
    y: p.y,
    draw: () => drawPlayer(ctx, p, project, assets, world.tick),
  }));
  entities.push({ y: world.ball.y, draw: () => drawBall(ctx, world.ball, project, assets, world.tick) });
  entities.sort((a, b) => a.y - b.y).forEach((e) => e.draw());

  ctx.restore();
}
