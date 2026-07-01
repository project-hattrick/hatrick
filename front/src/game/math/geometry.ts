import type { Player, Vec2 } from '../core/types';

export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export const speed = (p: { vx: number; vy: number }): number => Math.hypot(p.vx, p.vy);

/** Closest item in a list to a reference point (by euclidean distance). */
export function nearest<T extends Vec2>(list: T[], o: Vec2): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const p of list) {
    const d = dist(p, o);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

/** Distance from a player to the nearest opponent. */
export function nearestOppDist(players: Player[], p: Player): number {
  let md = Infinity;
  for (const q of players) if (q.team !== p.team) md = Math.min(md, dist(p, q));
  return md;
}

/** Steers a player toward (tx, ty) at up to `sp`, easing in over the last 10 units. */
export function moveTo(p: Player, tx: number, ty: number, sp: number): void {
  const dx = tx - p.x;
  const dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 5) {
    p.vx = 0;
    p.vy = 0;
    return;
  }
  const want = Math.min(sp, d * 0.5);
  p.vx = (dx / d) * want;
  p.vy = (dy / d) * want;
  if (Math.abs(dx) > 3) p.faceX = dx / d;
  p.faceY = dy / d;
}
