import type { BodyAnim, CelebrationPhase, CoachMode, PlayerAction, RefMode, Role, Team } from '../enums';

/** Minimal per-player state the renderer needs to redraw a recorded frame. */
export interface ReplayPlayerSnap {
  id: number;
  x: number;
  y: number;
  facing: number;
  mode: BodyAnim;
  action: PlayerAction;
  actionElapsed: number;
  team: Team;
  role: Role;
  celebrationPhase: CelebrationPhase;
  celebrationLift: number;
}

export interface ReplayBallSnap {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  spin: number;
  impact: number;
}

export interface ReplayRefSnap {
  active: boolean;
  x: number;
  y: number;
  mode: RefMode;
  elapsed: number;
  mirror: boolean;
}

export interface ReplayCoachSnap {
  x: number;
  y: number;
  depth: number;
  mode: CoachMode;
}

/** One recorded sim frame. `t` is the RAF clock (ms) — the same clock render/frameIndexFor consume. */
export interface ReplaySnapshot {
  t: number;
  players: ReplayPlayerSnap[];
  ball: ReplayBallSnap;
  referee: ReplayRefSnap;
  coach: ReplayCoachSnap;
}
