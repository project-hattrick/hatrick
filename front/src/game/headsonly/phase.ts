import { DrivenPhase } from '../realgk/enums';
import { moveToward } from './ai';
import { TUNING, Team, type GameState } from './types';

/**
 * Cheap match-structure support for the heads runtime (the realgk arenas get the full staging):
 * on half/full time the squads stroll to their touchline clusters and the sim stops resolving play;
 * kickoff (or a new `setDriven`) resumes and the positioning AI pulls everyone back into shape.
 * Lives outside engine.ts (already at the 600-line cap) — the engine only dispatches here.
 */

export enum HeadsPhase {
  Live = 'live',
  HalfTime = 'half_time',
  FullTime = 'full_time',
}

export interface HeadsPhaseState {
  phase: HeadsPhase;
  timer: number;
}

export const freshHeadsPhase = (): HeadsPhaseState => ({ phase: HeadsPhase.Live, timer: 0 });

/** Back to live play (a new match / setDriven always leaves any old break or full-time freeze). */
export function resetHeadsPhase(ps: HeadsPhaseState): void {
  ps.phase = HeadsPhase.Live;
  ps.timer = 0;
}

/** Post-whistle beat before the full-time scene hard-freezes under the arena overlay. */
const FULL_TIME_FREEZE_SECONDS = 5;
const BREAK_WALK_SPEED = TUNING.playerSpeed * 0.5;
/** Break clusters near the bottom touchline (normalized pitch coords), one side per team. */
const BREAK_Y = 0.9;
const BREAK_X_EDGE = 0.1;
const BREAK_X_STEP = 0.024;

function parkBall(state: GameState): void {
  const { ball } = state;
  ball.ownerId = null;
  ball.x = 0.5;
  ball.y = 0.5;
  ball.vx = 0;
  ball.vy = 0;
  ball.cooldown = 5;
  ball.trail.length = 0;
}

/** Feed/director phase signal (idempotent; Kickoff doubles as the second-half resume). */
export function applyHeadsPhase(ps: HeadsPhaseState, state: GameState, phase: DrivenPhase): void {
  if (phase === DrivenPhase.HalfTime) {
    if (ps.phase !== HeadsPhase.Live) return;
    ps.phase = HeadsPhase.HalfTime;
    ps.timer = 0;
    parkBall(state);
  } else if (phase === DrivenPhase.FullTime) {
    if (ps.phase === HeadsPhase.FullTime) return;
    ps.phase = HeadsPhase.FullTime;
    ps.timer = 0;
    parkBall(state);
  } else {
    ps.phase = HeadsPhase.Live;
  }
}

/**
 * Break tick — returns true when it owns the frame (Live returns false and the engine runs normally).
 * Players walk to their clusters and idle; full time freezes entirely after the beat lands.
 */
export function updateHeadsBreak(ps: HeadsPhaseState, state: GameState, dt: number): boolean {
  if (ps.phase === HeadsPhase.Live) return false;
  ps.timer += dt;
  if (ps.phase === HeadsPhase.FullTime && ps.timer > FULL_TIME_FREEZE_SECONDS) return true;
  let blueIdx = 0;
  let redIdx = 0;
  for (const p of state.players) {
    const idx = p.team === Team.Blue ? blueIdx++ : redIdx++;
    const tx = p.team === Team.Blue ? BREAK_X_EDGE + idx * BREAK_X_STEP : 1 - BREAK_X_EDGE - idx * BREAK_X_STEP;
    moveToward(p, tx, BREAK_Y, BREAK_WALK_SPEED, dt);
  }
  return true;
}
