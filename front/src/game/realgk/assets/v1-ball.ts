import { pad2 } from '../util';

/**
 * v1 rolling-ball sprite set (`public/game/ball/frames/ball-NN.png`) reused by the Real Match GK
 * renderer. Ported out of the removed shared 2.5D manifest so realgk stays self-contained. The banding
 * mirrors the engine's own `sim/ball.ts ballFrameIndex(ball)` (impact base 10, a 5-wide spin sub-frame).
 */
export const BALL_FRAMES = 19;

/** Squashed contact sprite shown on ground impact (`ball.impact > 0`). */
export const BALL_IMPACT_FRAME = 10;

export const ballFramePath = (i: number): string => `/game/ball/frames/ball-${pad2(i)}.png`;

/** Rolling frame from speed (px/s) + spin — spin picks a 5-wide sub-frame within the speed band. */
export function ballFrameIndex(speed: number, spin: number): number {
  const spinIdx = ((Math.floor(spin) % 5) + 5) % 5;
  const base = speed > 235 ? 5 : speed > 70 ? 15 : 0;
  return Math.min(BALL_FRAMES - 1, base + spinIdx);
}
