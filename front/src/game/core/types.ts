import type { Phase, Role, Team } from '../enums';

export interface Vec2 {
  x: number;
  y: number;
}

/** A formation slot: role + home position as fractions of the pitch (depth, width) for the Blue side. */
export type FormationSlot = [Role, number, number];
export type Formation = FormationSlot[];

/** Pitch-rules data a checkpoint feeds the simulation. */
export interface SimConfig {
  formations: Formation[];
  skipIntro?: boolean;
}

/** A single actor (outfield player or goalkeeper) in logical pitch space. */
export interface Player {
  team: Team;
  role: Role;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  faceX: number;
  faceY: number;
  phase: number;
  introDelay: number;
  kickUntil: number;
  kickStart: number;
  celUntil: number;
  ponderUntil: number;
  diveUntil: number;
  diveStart: number;
  catchUntil: number;
  catchStart: number;
  gkKickUntil: number;
  gkKickStart: number;
  holding: boolean;
  holdKick: number;
  slideUntil: number;
  slideStart: number;
  slideCd: number;
  lane: number;
  wob: number;
  wsp: number;
  spdK: number;
  aggr: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  z: number;
  vz: number;
  roll: number;
  impact: number;
}

export interface Projection {
  x: number;
  y: number;
  scale: number;
}

/** Maps logical pitch coords to canvas coords + a depth scale. */
export type ProjectFn = (wx: number, wy: number) => Projection;

/** All mutable simulation state for one match. Lives outside React; mutated by the loop. */
export interface World {
  players: Player[];
  ball: Ball;
  freeBall: number;
  think: number;
  scoreBlue: number;
  scoreRed: number;
  pausaGol: number;
  clock: number;
  tick: number;
  phase: Phase;
  introT: number;
  holdStart: number;
  lastDono: Player | null;
  holder: Player | null;
  ballContestCd: number;
  camTargetIdx: number;
  kickoffTick: number;
  event: string;
  eventSeq: number;
}

/** Partial HUD snapshot pushed to React only when a value changes. */
export interface HudPatch {
  scoreBlue?: number;
  scoreRed?: number;
  clock?: string;
  eventText?: string;
  paused?: boolean;
  speed?: number;
  cameraLabel?: string;
  targetLabel?: string;
  rainLabel?: string;
  goalActive?: boolean;
}

/** Imperative controls exposed to the React layer. */
export interface EngineHandle {
  togglePause: () => void;
  cycleSpeed: () => void;
  cycleCamera: () => void;
  cycleTarget: () => void;
  cycleRain: () => void;
  reset: () => void;
  destroy: () => void;
}
