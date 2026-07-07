/**
 * Kick dust / turf chips / shot pulse / slow-mo — ported from the realgk Effects Lab
 * (`src/game/realgk/effects.ts`) and adapted to the heads-only normalized pitch space.
 * Particle x/y live in pitch fractions; lift/size are screen px so they read the same at any zoom.
 */
import { clamp, rand, type Rect } from './types';

export enum DustKind {
  Dust = 'dust',
  Turf = 'turf',
}

export interface DustParticle {
  kind: DustKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lift: number;
  vlift: number;
  age: number;
  life: number;
  size: number;
  color: string;
}

export interface ShotPulse {
  x: number;
  y: number;
  angle: number;
  strength: number;
  age: number;
  life: number;
}

export interface EffectsState {
  particles: DustParticle[];
  shots: ShotPulse[];
  slowMoTimer: number;
}

const DUST_COLORS = ['#c8ad78', '#a88c5e', '#dfc99a'];
const TURF_COLORS = ['#486f37', '#31562c', '#71924a'];
const MAX_PARTICLES = 90;
const MAX_SHOTS = 6;
const SLOW_MO_SCALE = 0.35;
const SLOW_MO_DURATION = 0.6;

export function createEffects(): EffectsState {
  return { particles: [], shots: [], slowMoTimer: 0 };
}

function push(fx: EffectsState, particles: DustParticle[]): void {
  fx.particles.push(...particles);
  if (fx.particles.length > MAX_PARTICLES) fx.particles.splice(0, fx.particles.length - MAX_PARTICLES);
}

/** Dust bloom kicked backwards off a pass/shot contact, plus a couple of turf chips. */
export function spawnKickDust(fx: EffectsState, x: number, y: number, dirX: number, dirY: number, strength: number): void {
  const back = Math.atan2(-dirY, -dirX);
  const dustCount = Math.round(4 + strength * 6);
  const particles: DustParticle[] = [];
  for (let i = 0; i < dustCount; i++) {
    const angle = back + rand(-0.85, 0.85);
    const speed = rand(0.018, 0.055) * (0.6 + strength * 0.7);
    particles.push({
      kind: DustKind.Dust,
      x: x + rand(-0.004, 0.004),
      y: y + rand(-0.003, 0.003),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lift: rand(0, 3),
      vlift: rand(14, 40) * (0.6 + strength * 0.6),
      age: 0,
      life: rand(0.32, 0.58),
      size: rand(2.2, 5) * (0.7 + strength * 0.45),
      color: DUST_COLORS[i % DUST_COLORS.length],
    });
  }
  const turfCount = Math.round(1 + strength * 3);
  for (let i = 0; i < turfCount; i++) {
    particles.push({
      kind: DustKind.Turf,
      x: x + rand(-0.003, 0.003),
      y: y + rand(-0.003, 0.003),
      vx: rand(-0.03, 0.03),
      vy: rand(-0.02, 0.02),
      lift: 1,
      vlift: rand(32, 70) * (0.7 + strength * 0.5),
      age: 0,
      life: rand(0.26, 0.48),
      size: rand(1.2, 2.4),
      color: TURF_COLORS[i % TURF_COLORS.length],
    });
  }
  push(fx, particles);
}

/** Compact dirt puff from a ball-to-boundary bounce; strength grows with impact speed. */
export function spawnBounceDust(fx: EffectsState, x: number, y: number, speed: number): void {
  const strength = clamp((speed - 0.2) / 0.9, 0.2, 1);
  const count = Math.round(3 + strength * 6);
  const particles: DustParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rand(Math.PI * 0.08, Math.PI * 0.92);
    const s = rand(0.012, 0.04) * (0.65 + strength * 0.65);
    particles.push({
      kind: DustKind.Dust,
      x: x + rand(-0.003, 0.003),
      y: y + rand(-0.002, 0.002),
      vx: Math.cos(angle) * s,
      vy: rand(-0.01, 0.014),
      lift: rand(0, 3),
      vlift: Math.sin(angle) * 32 * (0.65 + strength * 0.65),
      age: 0,
      life: rand(0.3, 0.55),
      size: rand(2.2, 4.6) * (0.7 + strength * 0.45),
      color: DUST_COLORS[i % DUST_COLORS.length],
    });
  }
  push(fx, particles);
}

/** Skid dust off a hard direction reversal — kicks out opposite the NEW facing (`dir` = ±1). */
export function spawnSkidDust(fx: EffectsState, x: number, y: number, dir: number): void {
  const count = Math.round(rand(3, 6));
  const particles: DustParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      kind: DustKind.Dust,
      x: x + rand(-0.004, 0.004),
      y: y + rand(-0.001, 0.002),
      vx: -dir * rand(0.02, 0.05),
      vy: rand(-0.006, 0.008),
      lift: rand(0, 2),
      vlift: rand(12, 34),
      age: 0,
      life: rand(0.24, 0.44),
      size: rand(2, 4.2),
      color: DUST_COLORS[i % DUST_COLORS.length],
    });
  }
  push(fx, particles);
}

/** The lab "Power Arc" pulse at the exact release point of a goal-directed strike. */
export function spawnShotPulse(fx: EffectsState, x: number, y: number, angle: number, strength: number): void {
  fx.shots.push({ x, y, angle, strength: clamp(strength, 0.72, 1.15), age: 0, life: 0.42 });
  if (fx.shots.length > MAX_SHOTS) fx.shots.shift();
}

/** Short local slow-mo window so shots read frame-by-frame. */
export function triggerSlowMo(fx: EffectsState): void {
  fx.slowMoTimer = SLOW_MO_DURATION;
}

export function slowMoScale(fx: EffectsState): number {
  return fx.slowMoTimer > 0 ? SLOW_MO_SCALE : 1;
}

/** Advance particles with the (possibly slowed) sim dt; the slow-mo timer runs on real dt. */
export function updateEffects(fx: EffectsState, simDt: number, realDt: number): void {
  fx.slowMoTimer = Math.max(0, fx.slowMoTimer - realDt);
  for (const p of fx.particles) {
    p.age += simDt;
    p.x += p.vx * simDt;
    p.y += p.vy * simDt;
    p.lift = Math.max(0, p.lift + p.vlift * simDt);
    p.vlift -= (p.kind === DustKind.Turf ? 190 : 92) * simDt;
    p.vx *= Math.pow(p.kind === DustKind.Dust ? 0.92 : 0.86, simDt * 60);
    p.vy *= Math.pow(0.9, simDt * 60);
  }
  fx.particles = fx.particles.filter((p) => p.age < p.life);
  for (const shot of fx.shots) shot.age += simDt;
  fx.shots = fx.shots.filter((shot) => shot.age < shot.life);
}

function drawPixelCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  pixel: number,
  start: number,
  span: number,
): void {
  const steps = Math.max(8, Math.round(22 * (span / (Math.PI * 2))));
  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const angle = start + (span * i) / steps;
    const px = Math.round((x + Math.cos(angle) * radius) / pixel) * pixel;
    const py = Math.round((y + Math.sin(angle) * radius * 0.48) / pixel) * pixel;
    ctx.fillRect(px - pixel * 0.5, py - pixel * 0.5, pixel, pixel);
  }
}

/** Paint dust + shot pulses in screen space (rect maps pitch fractions → px). */
export function drawEffects(ctx: CanvasRenderingContext2D, rect: Rect, fx: EffectsState): void {
  for (const p of fx.particles) {
    const progress = p.age / p.life;
    const size = p.size * (p.kind === DustKind.Dust ? 1 + progress * 0.9 : 1);
    const sx = rect.x + p.x * rect.w;
    const sy = rect.y + p.y * rect.h - p.lift;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * (p.kind === DustKind.Dust ? 0.62 : 0.9);
    ctx.fillStyle = p.color;
    if (p.kind === DustKind.Dust) {
      ctx.fillRect(Math.round(sx - size), Math.round(sy - size * 0.45), Math.max(2, Math.round(size * 2)), Math.max(1, Math.round(size * 0.9)));
    } else {
      ctx.translate(Math.round(sx), Math.round(sy));
      ctx.rotate(progress * 5.4);
      ctx.fillRect(-size, -size * 0.45, size * 2, Math.max(1, size * 0.9));
    }
    ctx.restore();
  }
  for (const shot of fx.shots) {
    const progress = shot.age / shot.life;
    const sx = rect.x + shot.x * rect.w;
    const sy = rect.y + shot.y * rect.h;
    const radius = (10 + progress * 35) * shot.strength;
    ctx.save();
    ctx.globalAlpha = Math.pow(1 - progress, 1.35) * 0.92;
    drawPixelCircle(ctx, sx, sy, radius, '#f4ffcc', 2, shot.angle - 1.05, 2.1);
    drawPixelCircle(ctx, sx, sy, radius * 0.7, '#aef019', 2, shot.angle - 0.78, 1.56);
    ctx.restore();
  }
}
