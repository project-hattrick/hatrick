import type { RealGkWorld } from '../types';
import { clamp } from '../util';

/**
 * Feed-driven match clock: while `world.driven`, `match.time` (match seconds) follows the feed's
 * `minute` instead of the autonomous TIME_SCALE tick. The clock sweeps toward the latest feed minute
 * (never jumps, never goes backwards) and drifts forward between events at the pace implied by the
 * recent event cadence — so an 8× replay shows a fast clock while the players animate at 1×.
 */
export interface DrivenClock {
  /** Latest authoritative match-second from the feed (monotonic). */
  targetSec: number;
  /** Estimated clock pace in match-seconds per wall-second (EMA over recent events). */
  paceSecPerSec: number;
  /** Wall timestamp (ms) of the last feed minute, for pace estimation. */
  lastEventWallMs: number;
}

/** Pace ceiling: a 60× replay with the server's 4s gap cap tops out well under this. */
const MAX_PACE = 180;
/** Seconds to close a gap to a fresh target (a visible sweep, not a jump). */
const CATCHUP_SECONDS = 2;
/** How many "server gap caps" the clock may drift past the last known minute. */
const DRIFT_CAP_GAPS = 4;
/** Pace half-life-ish decay while drifting — a stalled feed brings the clock to a stop. */
const PACE_DECAY_SECONDS = 10;
/** EMA weight for new pace samples. */
const PACE_EMA = 0.5;

export const freshDrivenClock = (): DrivenClock => ({ targetSec: 0, paceSecPerSec: 0, lastEventWallMs: 0 });

/** Registers the feed's match minute (called per event that carries one). */
export function setClockDriven(world: RealGkWorld, minute: number, wallNowMs: number): void {
  const clock = world.drivenClock ?? (world.drivenClock = freshDrivenClock());
  const nextTarget = Math.max(clock.targetSec, minute * 60);
  if (clock.lastEventWallMs > 0 && nextTarget > clock.targetSec) {
    const wallDt = (wallNowMs - clock.lastEventWallMs) / 1000;
    if (wallDt > 0.05) {
      const sample = clamp((nextTarget - clock.targetSec) / wallDt, 0, MAX_PACE);
      clock.paceSecPerSec = clock.paceSecPerSec > 0 ? clock.paceSecPerSec * (1 - PACE_EMA) + sample * PACE_EMA : sample;
    }
  }
  clock.targetSec = nextTarget;
  clock.lastEventWallMs = wallNowMs;
}

/** Advances `match.time` toward/past the feed target. Replaces the TIME_SCALE tick while driven. */
export function tickDrivenClock(world: RealGkWorld, dt: number): void {
  const clock = world.drivenClock;
  if (!clock) return;
  const { match } = world;
  if (match.time < clock.targetSec) {
    // Behind the feed: sweep up fast enough to close the gap in ~CATCHUP_SECONDS.
    const rate = Math.max(clock.paceSecPerSec, (clock.targetSec - match.time) / CATCHUP_SECONDS);
    match.time = Math.min(clock.targetSec, match.time + rate * dt);
    return;
  }
  // At/ahead of the feed: drift forward at the estimated pace, capped so a dead feed can't run away.
  const cap = clock.targetSec + clock.paceSecPerSec * DRIFT_CAP_GAPS;
  match.time = Math.min(cap, match.time + clock.paceSecPerSec * dt);
  clock.paceSecPerSec *= Math.exp(-dt / PACE_DECAY_SECONDS);
}
