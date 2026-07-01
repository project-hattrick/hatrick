import type { RealGkConfig } from './config';
import type { BodyAnim, CoachMode, PlayerAction, RefMode, RefPhase, Role, Team } from './enums';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface RealGkPlayer {
  id: number;
  name: string;
  team: Team;
  dir: number;
  role: Role;
  homeLat: number;
  homeDepth: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  lookX: number;
  lookY: number;
  desiredLookX: number;
  desiredLookY: number;
  facingLock: number;
  pendingFacing: number;
  pendingFacingTime: number;
  targetX: number;
  targetY: number;
  idleMode: BodyAnim;
  modeLock: number;
  mode: BodyAnim;
  think: number;
  action: PlayerAction;
  actionTimer: number;
  actionElapsed: number;
  diveDir: number;
  diveStartX: number;
  diveStartY: number;
  saveCooldown: number;
}

export interface Ball {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spin: number;
  spinRate: number;
  ownerId: number | null;
  cooldown: number;
  impact: number;
}

export interface Referee {
  active: boolean;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  mode: RefMode;
  phase: RefPhase;
  elapsed: number;
  mirror: boolean;
  patrolLeftX: number;
  patrolRightX: number;
  patrolY: number;
  patrolDir: number;
  patrolPause: number;
  nextPatrolPause: number;
  homeX: number;
  homeY: number;
}

/** Sideline coach that flips between idle and angry during intense play near the bench. */
export interface Coach {
  x: number;
  y: number;
  depth: number;
  mode: CoachMode;
  timer: number;
  cooldown: number;
  angryDuration: number;
}

export interface MatchState {
  blue: number;
  red: number;
  time: number;
  celebration: number;
  kickoffTeam: Team;
  statusTitle: string;
  statusText: string;
  ballText: string;
}

/** All mutable v2 state. Mutated by the loop; lives outside React. */
export interface RealGkWorld {
  players: RealGkPlayer[];
  nextPlayerId: number;
  ball: Ball;
  referee: Referee;
  coach: Coach;
  match: MatchState;
  /** The virtual pitch size (viewport × cfg.fieldScale). All sim/field math runs in these coords. */
  size: Size;
  /** The on-screen viewport (canvas CSS size). The camera maps a window of `size` into this. */
  view: Size;
  cfg: RealGkConfig;
  dpr: number;
}

/** HUD snapshot pushed to React on change. */
export interface RealGkHud {
  scoreBlue: number;
  scoreRed: number;
  clock: string;
  phase: string;
  statusTitle: string;
  statusText: string;
  ballText: string;
  paused: boolean;
  speed: number;
  refereeActive: boolean;
  goalActive: boolean;
  cameraLabel: string;
  targetLabel: string;
}

export type RealGkHudPatch = Partial<RealGkHud>;

export interface RealGkHandle {
  togglePause: () => void;
  cycleSpeed: () => void;
  /** Toggles the 2D (flat) render: constant sprite size + squashed pitch. */
  setFlat: (value: boolean) => void;
  cycleCamera: () => void;
  cycleTarget: () => void;
  restart: () => void;
  spawnReferee: () => void;
  resize: () => void;
  destroy: () => void;
}
