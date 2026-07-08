/** Shared types, enums and tuning for the "Heads Only" top-view 11-v-11 sandbox. */
import type { EffectsState } from './effects';

export enum Team {
  Blue = 'blue',
  Red = 'red',
}

/** The three head busts that ship per persona (side is mirrored for left-facing). */
export enum HeadView {
  Front = 'front',
  Back = 'back',
  Side = 'side',
}

export enum FxKind {
  Spark = 'spark',
  Ring = 'ring',
}

export interface Player {
  id: number;
  team: Team;
  /** 0..PERSONA_COUNT-1 → persona face p01..p11. */
  personaId: number;
  jersey: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  view: HeadView;
  flip: boolean;
  /** Walk-cycle phase driving the head bob. */
  bob: number;
  /** Current normalized speed magnitude (drives bob amplitude + ball spin). */
  speed: number;
  /** Current dribble target while owning the ball (owner AI). */
  aimX: number;
  aimY: number;
  /** Next on-ball decision timestamp (state.time seconds). */
  decideAt: number;
  /** Off-ball run offset + when to re-roll it. */
  runX: number;
  runY: number;
  runUntil: number;
  /** Skid-dust bookkeeping (cooldown + last horizontal facing sign). */
  skidCd: number;
  lastDirX: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: number | null;
  cooldown: number;
  /** Accumulated roll → ball frame index. */
  spin: number;
  trail: Array<{ x: number; y: number }>;
  /** Who last released the ball — feeds SAVE / INTERCEPT events. */
  lastKickerId: number | null;
}

export interface Fx {
  kind: FxKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
  color: string;
}

export interface GoalBanner {
  t: number;
  team: Team;
}

/** Short match-event toast shown under the scoreboard (SHOOTS! / SAVE! / STEAL...). */
export interface EventToast {
  text: string;
  color: string;
  t: number;
  life: number;
}

/**
 * Feed-driven direction of play. When `attackingTeam` is set, the AI "molds"
 * toward it: the attacking side pushes forward and commits proportional to
 * `threat` (0..1), the other side compacts. Default (null / 0) = autonomous.
 */
export interface MatchIntent {
  attackingTeam: Team | null;
  threat: number;
}

export interface GameState {
  players: Player[];
  ball: Ball;
  fx: Fx[];
  effects: EffectsState;
  events: EventToast[];
  scoreBlue: number;
  scoreRed: number;
  /** Displayed match clock (scaled). */
  clock: number;
  /** Real simulation seconds — drives AI decision timers. */
  time: number;
  possBlue: number;
  possRed: number;
  controlledId: number | null;
  /** Intended receiver of the in-flight pass (runs to meet the ball). */
  passTargetId: number | null;
  goalBanner: GoalBanner | null;
  shake: number;
  /** External event feed steering the sim (see MatchIntent). */
  intent: MatchIntent;
  /** True when a live/replay feed drives the match: disables auto-goals, random
   *  steals and user control so possession + score follow the feed. */
  driven: boolean;
}

export type HeadSet = Record<HeadView, HTMLImageElement>;

export interface Assets {
  heads: HeadSet[];
  ball: HTMLImageElement[];
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** How many distinct persona faces ship (p01..p11). One per outfield slot. */
export const PERSONA_COUNT = 11;
export const BALL_FRAMES = 19;

export const TEAM_COLOR: Record<Team, string> = {
  [Team.Blue]: '#38bdf8',
  [Team.Red]: '#fb7185',
};

export const TEAM_GLOW: Record<Team, string> = {
  [Team.Blue]: 'rgba(56, 189, 248, 0.55)',
  [Team.Red]: 'rgba(251, 113, 133, 0.55)',
};

export const TEAM_NAME: Record<Team, string> = {
  [Team.Blue]: 'BLUE',
  [Team.Red]: 'RED',
};

/** Goal mouth as a fraction of pitch height (centered). */
export const GOAL_TOP = 0.42;
export const GOAL_BOTTOM = 0.58;

/** Tuning — all speeds are in pitch-fractions per second. */
export const TUNING = {
  playerSpeed: 0.185,
  aiChaseSpeed: 0.155,
  aiHoldSpeed: 0.095,
  aiDribbleSpeed: 0.14,
  keeperSpeed: 0.12,
  receiverSpeed: 0.18,
  passSpeed: 0.72,
  shootSpeed: 1.02,
  frictionPerSec: 0.32,
  clockScale: 8,
} as const;

export interface Slot {
  x: number;
  y: number;
  jersey: number;
}

/**
 * Blue 4-3-3, attacking toward the right goal (x → 1). Red is the mirror (x → 1 - x).
 * Slot index maps 1:1 to persona id (slot 0 → p01, the keeper).
 */
export const FORMATION: Slot[] = [
  { x: 0.045, y: 0.5, jersey: 1 }, // GK
  { x: 0.17, y: 0.16, jersey: 2 }, // RB
  { x: 0.14, y: 0.38, jersey: 5 }, // CB
  { x: 0.14, y: 0.62, jersey: 4 }, // CB
  { x: 0.17, y: 0.84, jersey: 3 }, // LB
  { x: 0.31, y: 0.3, jersey: 6 }, // RM
  { x: 0.3, y: 0.52, jersey: 8 }, // CM
  { x: 0.31, y: 0.74, jersey: 7 }, // LM
  { x: 0.44, y: 0.24, jersey: 11 }, // RW
  { x: 0.47, y: 0.5, jersey: 9 }, // CF
  { x: 0.44, y: 0.76, jersey: 10 }, // LW
];

export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export const len = (x: number, y: number): number => Math.hypot(x, y) || 1;

export const rand = (min: number, max: number): number => min + Math.random() * (max - min);

/** Unit direction the player is facing, from its head view + flip. */
export function facingVector(view: HeadView, flip: boolean): { x: number; y: number } {
  if (view === HeadView.Front) return { x: 0, y: 1 };
  if (view === HeadView.Back) return { x: 0, y: -1 };
  return { x: flip ? -1 : 1, y: 0 };
}

/** Resolve a head view (+ mirror flag) from a velocity, keeping the last facing when idle. */
export function facingFrom(
  vx: number,
  vy: number,
  prev: { view: HeadView; flip: boolean },
): { view: HeadView; flip: boolean } {
  if (Math.hypot(vx, vy) < 0.012) return prev;
  if (Math.abs(vx) > Math.abs(vy)) return { view: HeadView.Side, flip: vx < 0 };
  return vy < 0 ? { view: HeadView.Back, flip: false } : { view: HeadView.Front, flip: false };
}
