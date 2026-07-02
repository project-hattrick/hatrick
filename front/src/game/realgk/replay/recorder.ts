import type { RealGkWorld } from '../types';
import type { ReplaySnapshot } from './types';

const RECORD_HZ = 24;
const BUFFER_SECONDS = 5;
const CAPACITY = RECORD_HZ * BUFFER_SECONDS;

export interface ReplayRecorder {
  /** Stores a snapshot, self-throttled to RECORD_HZ (`force` bypasses — used for the goal frame). */
  capture: (world: RealGkWorld, now: number, force?: boolean) => void;
  /** Chronological snapshots with t in [fromMs, toMs]. */
  slice: (fromMs: number, toMs: number) => ReplaySnapshot[];
  /** Covered timespan in ms (0 when fewer than 2 snapshots). */
  spanMs: () => number;
  /** Invalidates the buffer — call on resize/restart (players respawn) and after each replay. */
  clear: () => void;
}

function snapshot(world: RealGkWorld, now: number): ReplaySnapshot {
  return {
    t: now,
    players: world.players.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      facing: p.facing,
      mode: p.mode,
      action: p.action,
      actionElapsed: p.actionElapsed,
      team: p.team,
      role: p.role,
      celebrationPhase: p.celebrationPhase,
      celebrationLift: p.celebrationLift,
    })),
    ball: { x: world.ball.x, y: world.ball.y, z: world.ball.z, vx: world.ball.vx, vy: world.ball.vy, spin: world.ball.spin, impact: world.ball.impact },
    referee: {
      active: world.referee.active,
      x: world.referee.x,
      y: world.referee.y,
      mode: world.referee.mode,
      elapsed: world.referee.elapsed,
      mirror: world.referee.mirror,
    },
    coach: { x: world.coach.x, y: world.coach.y, depth: world.coach.depth, mode: world.coach.mode },
  };
}

/** Fixed-size ring buffer of world snapshots for the goal replay. */
export function createRecorder(): ReplayRecorder {
  const ring: (ReplaySnapshot | null)[] = new Array(CAPACITY).fill(null);
  let head = 0;
  let count = 0;
  let lastCaptureT = -Infinity;

  const ordered = (): ReplaySnapshot[] => {
    const out: ReplaySnapshot[] = [];
    for (let i = 0; i < count; i++) {
      const snap = ring[(head - count + i + CAPACITY * 2) % CAPACITY];
      if (snap) out.push(snap);
    }
    return out;
  };

  return {
    capture: (world, now, force = false) => {
      if (!force && now - lastCaptureT < 1000 / RECORD_HZ) return;
      lastCaptureT = now;
      ring[head] = snapshot(world, now);
      head = (head + 1) % CAPACITY;
      count = Math.min(count + 1, CAPACITY);
    },
    slice: (fromMs, toMs) => ordered().filter((s) => s.t >= fromMs && s.t <= toMs),
    spanMs: () => {
      const all = ordered();
      return all.length < 2 ? 0 : all[all.length - 1].t - all[0].t;
    },
    clear: () => {
      ring.fill(null);
      head = 0;
      count = 0;
      lastCaptureT = -Infinity;
    },
  };
}
