import { drawEffects } from './effects';
import {
  BALL_FRAMES,
  FxKind,
  GOAL_BOTTOM,
  GOAL_TOP,
  HeadView,
  TEAM_COLOR,
  TEAM_GLOW,
  TEAM_NAME,
  Team,
  clamp,
  type Assets,
  type Ball,
  type Fx,
  type GameState,
  type Player,
  type Rect,
} from './types';

const STRIPES = 12;
const GOAL_DEPTH = 20;

/** Largest 16:10-ish pitch that fills the viewport with a small apron for the goals. */
export function pitchRect(viewW: number, viewH: number): Rect {
  const padX = 34;
  const padTop = 60;
  const padBottom = 74;
  const aspect = 1.6;
  let w = viewW - padX * 2;
  let h = w / aspect;
  const maxH = viewH - padTop - padBottom;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  return { x: (viewW - w) / 2, y: padTop + (maxH - h) / 2, w, h };
}

const px = (rect: Rect, nx: number): number => rect.x + nx * rect.w;
const py = (rect: Rect, ny: number): number => rect.y + ny * rect.h;

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.1, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  g.addColorStop(0, '#0c2b32');
  g.addColorStop(1, '#03121a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawTurf(ctx: CanvasRenderingContext2D, rect: Rect): void {
  ctx.save();
  // Depth shadow under the pitch slab.
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  const turf = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  turf.addColorStop(0, '#0e7a4f');
  turf.addColorStop(1, '#0a5f3d');
  ctx.fillStyle = turf;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const stripeW = rect.w / STRIPES;
  for (let i = 0; i < STRIPES; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rect.x + stripeW * i, rect.y, stripeW, rect.h);
  }
  // Faint cross-mow rows → checkered broadcast turf.
  const rowH = rect.h / 6;
  for (let i = 1; i < 6; i += 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(rect.x, rect.y + rowH * i, rect.w, rowH);
  }
  // Soft vignette on the turf corners.
  const vg = ctx.createRadialGradient(
    rect.x + rect.w / 2,
    rect.y + rect.h / 2,
    rect.h * 0.3,
    rect.x + rect.w / 2,
    rect.y + rect.h / 2,
    rect.w * 0.62,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawArcD(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, right: boolean): void {
  ctx.beginPath();
  const a = 0.92;
  if (right) ctx.arc(cx, cy, r, Math.PI - a, Math.PI + a);
  else ctx.arc(cx, cy, r, -a, a);
  ctx.stroke();
}

function drawGoal(ctx: CanvasRenderingContext2D, rect: Rect, right: boolean): void {
  const yTop = py(rect, GOAL_TOP);
  const yBot = py(rect, GOAL_BOTTOM);
  const x0 = right ? rect.x + rect.w : rect.x;
  const dir = right ? 1 : -1;
  const x1 = x0 + dir * GOAL_DEPTH;
  ctx.save();
  ctx.fillStyle = 'rgba(3, 18, 26, 0.55)';
  ctx.fillRect(Math.min(x0, x1), yTop, GOAL_DEPTH, yBot - yTop);
  ctx.strokeStyle = 'rgba(226,244,255,0.28)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const gx = x0 + dir * (GOAL_DEPTH * (i / 5));
    ctx.beginPath();
    ctx.moveTo(gx, yTop);
    ctx.lineTo(gx, yBot);
    ctx.stroke();
  }
  for (let i = 1; i < 4; i++) {
    const gy = yTop + ((yBot - yTop) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x0, gy);
    ctx.lineTo(x1, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(240,250,255,0.95)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x0, yTop);
  ctx.lineTo(x1, yTop);
  ctx.lineTo(x1, yBot);
  ctx.lineTo(x0, yBot);
  ctx.stroke();
  ctx.restore();
}

function drawPitchLines(ctx: CanvasRenderingContext2D, rect: Rect): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(236, 253, 245, 0.82)';
  ctx.lineWidth = 2.5;
  const inset = 8;
  ctx.strokeRect(rect.x + inset, rect.y + inset, rect.w - inset * 2, rect.h - inset * 2);

  const cx = px(rect, 0.5);
  const cyTop = rect.y + inset;
  const cyBot = rect.y + rect.h - inset;
  ctx.beginPath();
  ctx.moveTo(cx, cyTop);
  ctx.lineTo(cx, cyBot);
  ctx.stroke();

  const cy = py(rect, 0.5);
  const R = Math.min(rect.w, rect.h) * 0.13;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(236, 253, 245, 0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Penalty + goal areas both ends.
  const boxW = rect.w * 0.145;
  const boxTop = py(rect, 0.22);
  const boxH = rect.h * 0.56;
  const sixW = rect.w * 0.055;
  const sixTop = py(rect, 0.36);
  const sixH = rect.h * 0.28;
  for (const right of [false, true]) {
    const bx = right ? rect.x + rect.w - inset - boxW : rect.x + inset;
    ctx.strokeRect(bx, boxTop, boxW, boxH);
    const sx = right ? rect.x + rect.w - inset - sixW : rect.x + inset;
    ctx.strokeRect(sx, sixTop, sixW, sixH);
    const spotX = right ? rect.x + rect.w - inset - boxW * 0.66 : rect.x + inset + boxW * 0.66;
    ctx.fillStyle = 'rgba(236, 253, 245, 0.9)';
    ctx.beginPath();
    ctx.arc(spotX, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    drawArcD(ctx, spotX, cy, R * 0.82, right);
    drawGoal(ctx, rect, right);
  }

  // Corner arcs.
  ctx.lineWidth = 2;
  const corners = [
    [rect.x + inset, rect.y + inset, 0, Math.PI / 2],
    [rect.x + rect.w - inset, rect.y + inset, Math.PI / 2, Math.PI],
    [rect.x + rect.w - inset, rect.y + rect.h - inset, Math.PI, Math.PI * 1.5],
    [rect.x + inset, rect.y + rect.h - inset, Math.PI * 1.5, Math.PI * 2],
  ] as const;
  for (const [cxp, cyp, a0, a1] of corners) {
    ctx.beginPath();
    ctx.arc(cxp, cyp, 12, a0, a1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCornerFlags(ctx: CanvasRenderingContext2D, rect: Rect, clock: number): void {
  const inset = 8;
  const corners: Array<[number, number]> = [
    [rect.x + inset, rect.y + inset],
    [rect.x + rect.w - inset, rect.y + inset],
    [rect.x + rect.w - inset, rect.y + rect.h - inset],
    [rect.x + inset, rect.y + rect.h - inset],
  ];
  ctx.save();
  corners.forEach(([cx, cy], i) => {
    const wave = Math.sin(clock * 2.6 + i * 1.3) * 2.5;
    ctx.strokeStyle = 'rgba(240,250,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 16);
    ctx.stroke();
    ctx.fillStyle = '#d7ff5c';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 11, cy - 13 + wave);
    ctx.lineTo(cx, cy - 9);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function headImage(assets: Assets, p: Player): HTMLImageElement | null {
  const set = assets.heads[p.personaId];
  if (!set) return null;
  const img = set[p.view] ?? set[HeadView.Front];
  return img.complete && img.naturalWidth ? img : null;
}

function drawPlayer(ctx: CanvasRenderingContext2D, assets: Assets, rect: Rect, p: Player, state: GameState): void {
  const x = px(rect, p.x);
  const groundY = py(rect, p.y);
  const headH = clamp(rect.h * 0.076, 26, 58);
  const moving = p.speed > 0.02;
  const amp = moving ? headH * 0.11 : headH * 0.04;
  const bobOffset = -Math.abs(Math.sin(p.bob)) * amp;
  const sway = moving ? Math.sin(p.bob * 0.5) * headH * 0.04 : 0;
  const owner = state.ball.ownerId === p.id;
  const controlled = state.controlledId === p.id;
  const lift = Math.abs(bobOffset) / (amp || 1);

  // Foot shadow (shrinks as the head lifts).
  ctx.save();
  ctx.globalAlpha = 0.34 - lift * 0.12;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, groundY + 3, headH * 0.34 * (1 - lift * 0.18), headH * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Team ring / glow marker at the feet.
  ctx.save();
  const glow = ctx.createRadialGradient(x, groundY, 2, x, groundY, headH * 0.5);
  glow.addColorStop(0, TEAM_GLOW[p.team]);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = owner || controlled ? 0.9 : 0.5;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(x, groundY + 2, headH * 0.42, headH * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = TEAM_COLOR[p.team];
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, groundY + 2, headH * 0.3, headH * 0.13, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Controlled-player pulse ring + marker chevron.
  if (controlled) {
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 6);
    ctx.save();
    ctx.strokeStyle = '#eafff5';
    ctx.globalAlpha = 0.5 + pulse * 0.4;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x, groundY + 2, headH * (0.36 + pulse * 0.06), headH * 0.17, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#eafff5';
    const cyTop = groundY + bobOffset - headH * 1.02;
    ctx.beginPath();
    ctx.moveTo(x, cyTop + 8);
    ctx.lineTo(x - 6, cyTop);
    ctx.lineTo(x + 6, cyTop);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Head bust.
  const img = headImage(assets, p);
  if (img) {
    const ratio = img.naturalWidth / img.naturalHeight;
    const th = headH;
    const tw = th * ratio;
    const drawX = x - tw / 2 + sway;
    const drawY = groundY + bobOffset - th + 4;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (owner) {
      ctx.shadowColor = TEAM_COLOR[p.team];
      ctx.shadowBlur = 14;
    }
    if (p.flip) {
      ctx.translate(x + sway, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -tw / 2, drawY, tw, th);
    } else {
      ctx.drawImage(img, drawX, drawY, tw, th);
    }
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = TEAM_COLOR[p.team];
    ctx.beginPath();
    ctx.arc(x, groundY + bobOffset - headH * 0.4, headH * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Jersey number badge on the ring.
  ctx.save();
  ctx.fillStyle = TEAM_COLOR[p.team];
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(x, groundY + 2, headH * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#04121a';
  ctx.font = `700 ${Math.round(headH * 0.19)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(p.jersey), x, groundY + 3);
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, assets: Assets, rect: Rect, ball: Ball): void {
  const size = clamp(rect.h * 0.028, 14, 26);
  // Trail.
  ctx.save();
  for (let i = 0; i < ball.trail.length; i++) {
    const t = ball.trail[i];
    const a = (i / ball.trail.length) * 0.28;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(px(rect, t.x), py(rect, t.y), size * 0.4 * (i / ball.trail.length), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const x = px(rect, ball.x);
  const y = py(rect, ball.y);
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.5, size * 0.55, size * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const frame = assets.ball[Math.floor(ball.spin) % BALL_FRAMES];
  ctx.imageSmoothingEnabled = false;
  if (frame && frame.complete && frame.naturalWidth) {
    ctx.drawImage(frame, x - size / 2, y - size / 2, size, size);
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFx(ctx: CanvasRenderingContext2D, rect: Rect, fx: Fx): void {
  const x = px(rect, fx.x);
  const y = py(rect, fx.y);
  const p = fx.t / fx.life;
  ctx.save();
  if (fx.kind === FxKind.Spark) {
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = fx.color;
    ctx.beginPath();
    ctx.arc(x, y, 3 * (1 - p) + 1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.globalAlpha = (1 - p) * 0.8;
    ctx.strokeStyle = fx.color;
    ctx.lineWidth = 3 * (1 - p) + 1;
    ctx.beginPath();
    ctx.arc(x, y, 8 + p * 34, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScoreboard(ctx: CanvasRenderingContext2D, w: number, state: GameState): void {
  const cx = w / 2;
  const boardW = 300;
  const boardH = 64;
  const x = cx - boardW / 2;
  const y = 14;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 16, 24, 0.82)';
  ctx.strokeStyle = 'rgba(120, 200, 220, 0.28)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, boardW, boardH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = TEAM_COLOR[Team.Blue];
  ctx.beginPath();
  ctx.arc(x + 26, y + 26, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TEAM_COLOR[Team.Red];
  ctx.beginPath();
  ctx.arc(x + boardW - 26, y + 26, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#eafff5';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText(`${state.scoreBlue} : ${state.scoreRed}`, cx, y + 19);
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(226,244,255,0.62)';
  const mins = Math.floor(state.clock / 60) % 90;
  const secs = Math.floor(state.clock % 60);
  ctx.fillText(
    `${TEAM_NAME[Team.Blue]}   ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}   ${TEAM_NAME[Team.Red]}`,
    cx,
    y + 38,
  );

  // Possession split bar.
  const total = state.possBlue + state.possRed || 1;
  const blueFrac = state.possBlue / total;
  const barW = boardW - 48;
  const barX = x + 24;
  const barY = y + 50;
  ctx.fillStyle = TEAM_COLOR[Team.Blue];
  ctx.fillRect(barX, barY, barW * blueFrac, 5);
  ctx.fillStyle = TEAM_COLOR[Team.Red];
  ctx.fillRect(barX + barW * blueFrac, barY, barW * (1 - blueFrac), 5);
  ctx.restore();
}

/** Latest match-event toasts fading below the scoreboard (SHOOTS! / SAVE! / STEAL...). */
function drawEvents(ctx: CanvasRenderingContext2D, w: number, state: GameState): void {
  const recent = state.events.slice(-2);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  recent.forEach((ev, i) => {
    const alpha = clamp(1 - ev.t / ev.life, 0, 1);
    const pop = ev.t < 0.15 ? 1 + (0.15 - ev.t) * 2.4 : 1;
    ctx.globalAlpha = alpha;
    ctx.font = `800 ${Math.round(13 * pop)}px system-ui, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = ev.color;
    ctx.fillText(ev.text, w / 2, 96 + i * 18);
  });
  ctx.restore();
}

function drawGoalBanner(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState): void {
  const banner = state.goalBanner;
  if (!banner) return;
  const p = banner.t / 1.8;
  const scale = 1 + (1 - Math.min(1, banner.t * 5)) * 0.6;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (1 - p) * 2.4);
  ctx.fillStyle = 'rgba(3,14,20,0.35)';
  ctx.fillRect(0, h * 0.32, w, h * 0.36);
  ctx.translate(w / 2, h / 2);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = TEAM_COLOR[banner.team];
  ctx.shadowBlur = 28;
  ctx.fillStyle = TEAM_COLOR[banner.team];
  ctx.font = '900 76px system-ui, sans-serif';
  ctx.fillText('GOAL!', 0, 0);
  ctx.shadowBlur = 0;
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.fillStyle = '#eafff5';
  ctx.fillText(`${TEAM_NAME[banner.team]} SCORES`, 0, 52);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Paint the whole scene for one frame. */
export function renderScene(ctx: CanvasRenderingContext2D, assets: Assets, view: { w: number; h: number }, state: GameState): void {
  const rect = pitchRect(view.w, view.h);
  drawBackground(ctx, view.w, view.h);

  ctx.save();
  if (state.shake > 0.01) {
    const s = state.shake * 9;
    ctx.translate((Math.sin(state.clock * 90) * s), Math.cos(state.clock * 77) * s);
  }
  drawTurf(ctx, rect);
  drawPitchLines(ctx, rect);
  drawCornerFlags(ctx, rect, state.time);

  // Depth-sort heads by y so lower heads overlap higher ones.
  const ordered = [...state.players].sort((a, b) => a.y - b.y);
  for (const p of ordered) drawPlayer(ctx, assets, rect, p, state);
  drawBall(ctx, assets, rect, state.ball);
  drawEffects(ctx, rect, state.effects);
  for (const fx of state.fx) drawFx(ctx, rect, fx);
  ctx.restore();

  drawScoreboard(ctx, view.w, state);
  drawEvents(ctx, view.w, state);
  drawGoalBanner(ctx, view.w, view.h, state);
}
