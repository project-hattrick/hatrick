import { BallEffectKind, ShotEffectStyle } from './enums';
import { fieldBounds } from './field';
import type { BallEffectParticle, RealGkWorld, ShotEffectPulse } from './types';
import { clamp } from './util';

const DUST_COLORS = ['#c8ad78', '#a88c5e', '#dfc99a'];
const TURF_COLORS = ['#486f37', '#31562c', '#71924a'];
const MAX_PARTICLES = 96;
const MAX_SHOT_PULSES = 8;
const SHOT_SLOW_MO_SCALE = 0.32;
const SHOT_SLOW_MO_DURATION = 1.1;

export const SHOT_EFFECT_LABEL = 'Power Arc';

export function shotEffectLabelFor(style: ShotEffectStyle): string {
  return style === ShotEffectStyle.PowerArc ? SHOT_EFFECT_LABEL : SHOT_EFFECT_LABEL;
}

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

/** Emits a compact, depth-aware dirt bloom from a real ball-to-ground collision. */
export function spawnBallGroundImpact(world: RealGkWorld, impactSpeed: number): void {
  if (!world.cfg.features?.ballEffects) return;
  const strength = clamp((impactSpeed - 35) / 210, 0.18, 1);
  const dustCount = Math.round(5 + strength * 10);
  const turfCount = Math.round(2 + strength * 5);
  const particles: BallEffectParticle[] = [];

  for (let i = 0; i < dustCount; i++) {
    const angle = randomBetween(Math.PI * 0.08, Math.PI * 0.92);
    const speed = randomBetween(18, 54) * (0.65 + strength * 0.65);
    particles.push({
      kind: BallEffectKind.Dust,
      x: world.ball.x + randomBetween(-3, 3),
      y: world.ball.y + randomBetween(-2, 2),
      lift: randomBetween(0, 3),
      vx: Math.cos(angle) * speed,
      vy: randomBetween(-10, 16),
      vlift: Math.sin(angle) * speed * 0.72,
      age: 0,
      life: randomBetween(0.34, 0.62),
      size: randomBetween(2.4, 5.4) * (0.7 + strength * 0.45),
      color: DUST_COLORS[i % DUST_COLORS.length],
    });
  }

  for (let i = 0; i < turfCount; i++) {
    particles.push({
      kind: BallEffectKind.Turf,
      x: world.ball.x + randomBetween(-2, 2),
      y: world.ball.y + randomBetween(-2, 2),
      lift: 1,
      vx: randomBetween(-42, 42) * (0.7 + strength * 0.5),
      vy: randomBetween(-18, 20),
      vlift: randomBetween(32, 70) * (0.7 + strength * 0.5),
      age: 0,
      life: randomBetween(0.28, 0.5),
      size: randomBetween(1.2, 2.4),
      color: TURF_COLORS[i % TURF_COLORS.length],
    });
  }

  world.ballEffects.particles.push(...particles);
  if (world.ballEffects.particles.length > MAX_PARTICLES) {
    world.ballEffects.particles.splice(0, world.ballEffects.particles.length - MAX_PARTICLES);
  }
}

/** Emits the selected lab visual at the exact ball-release position of a goal-directed strike. */
export function spawnShotEffect(world: RealGkWorld, directionX: number, directionY: number, power: number): void {
  if (!world.cfg.features?.ballEffects) return;
  const len = Math.hypot(directionX, directionY) || 1;
  const nx = directionX / len;
  const ny = directionY / len;
  const contactOffset = clamp(7 + power / 160, 7, 10);
  world.ballEffects.shots.push({
    style: world.ballEffects.shotStyle,
    x: world.ball.x - nx * contactOffset,
    y: world.ball.y - ny * contactOffset,
    angle: Math.atan2(ny, nx),
    strength: clamp(power / 470, 0.72, 1.15),
    age: 0,
    life: 0.42,
  });
  if (world.ballEffects.shots.length > MAX_SHOT_PULSES) world.ballEffects.shots.shift();
}

/** Starts a short local slow-mo window so shot effects can be inspected frame-by-frame. */
export function triggerShotSlowMo(world: RealGkWorld): void {
  if (!world.cfg.features?.ballEffects) return;
  world.ballEffects.slowMoTimer = SHOT_SLOW_MO_DURATION;
}

export function cycleShotEffect(world: RealGkWorld): string {
  world.ballEffects.shotStyle = ShotEffectStyle.PowerArc;
  return SHOT_EFFECT_LABEL;
}

export function updateBallEffects(world: RealGkWorld, dt: number): void {
  world.ballEffects.slowMoTimer = Math.max(0, world.ballEffects.slowMoTimer - dt);
  const particles = world.ballEffects.particles;
  for (const particle of particles) {
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.lift = Math.max(0, particle.lift + particle.vlift * dt);
    particle.vlift -= (particle.kind === BallEffectKind.Turf ? 190 : 92) * dt;
    particle.vx *= Math.pow(particle.kind === BallEffectKind.Dust ? 0.92 : 0.86, dt * 60);
    particle.vy *= Math.pow(0.9, dt * 60);
  }
  world.ballEffects.particles = particles.filter((particle) => particle.age < particle.life);
  for (const shot of world.ballEffects.shots) shot.age += dt;
  world.ballEffects.shots = world.ballEffects.shots.filter((shot) => shot.age < shot.life);
}

export function clearBallEffects(world: RealGkWorld): void {
  world.ballEffects.particles = [];
  world.ballEffects.shots = [];
  world.ballEffects.slowMoTimer = 0;
}

export function shotSlowMoScale(world: RealGkWorld): number {
  return world.cfg.features?.ballEffects && world.ballEffects.slowMoTimer > 0 ? SHOT_SLOW_MO_SCALE : 1;
}

function drawPixelCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  pixel: number,
  start = 0,
  span = Math.PI * 2,
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

type ShotPainter = (ctx: CanvasRenderingContext2D, shot: ShotEffectPulse, progress: number, scale: number) => void;

const paintPowerArc: ShotPainter = (ctx, shot, progress, scale) => {
  const radius = (10 + progress * 35) * scale * shot.strength;
  const pixel = Math.max(1.5, 2.3 * scale);
  drawPixelCircle(ctx, shot.x, shot.y, radius, '#f4ffcc', pixel, shot.angle - 1.05, 2.1);
  drawPixelCircle(ctx, shot.x, shot.y, radius * 0.7, '#aef019', pixel, shot.angle - 0.78, 1.56);
};

/** Draws the particle cloud in field space so the existing camera transform handles scale and pan. */
export function drawBallEffects(ctx: CanvasRenderingContext2D, world: RealGkWorld): void {
  for (const particle of world.ballEffects.particles) {
    const progress = particle.age / particle.life;
    const depthScale = 0.7 + fieldBounds(world.size, particle.y).depth * 0.45;
    const size = particle.size * depthScale * (particle.kind === BallEffectKind.Dust ? 1 + progress * 0.9 : 1);
    ctx.save();
    ctx.globalAlpha = (1 - progress) * (particle.kind === BallEffectKind.Dust ? 0.62 : 0.9);
    ctx.fillStyle = particle.color;
    if (particle.kind === BallEffectKind.Dust) {
      ctx.fillRect(Math.round(particle.x - size), Math.round(particle.y - particle.lift - size * 0.45), Math.max(2, Math.round(size * 2)), Math.max(1, Math.round(size * 0.9)));
    } else {
      ctx.translate(Math.round(particle.x), Math.round(particle.y - particle.lift));
      ctx.rotate(progress * 5.4);
      ctx.fillRect(-size, -size * 0.45, size * 2, Math.max(1, size * 0.9));
    }
    ctx.restore();
  }
  for (const shot of world.ballEffects.shots) {
    const progress = shot.age / shot.life;
    const scale = 0.72 + fieldBounds(world.size, shot.y).depth * 0.48;
    ctx.save();
    ctx.globalAlpha = Math.pow(1 - progress, 1.35) * 0.92;
    paintPowerArc(ctx, shot, progress, scale);
    ctx.restore();
  }
}
