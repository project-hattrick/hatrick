import type { RealGkConfig } from './config';
import type { BodyAnim, CelebrationKind, CelebrationPhase, CoachMode, IntroStage, MatchPhase, PlayerAction, RefMode, RefPhase, RestartKind, RestartStage, Role, Team } from './enums';

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
  /** Goal celebration state (v4 features; inert `None` elsewhere). */
  celebrationKind: CelebrationKind;
  celebrationPhase: CelebrationPhase;
  celebrationTimer: number;
  /** Vertical hop offset in field px — sprite lifts, shadow stays grounded. */
  celebrationLift: number;
  brakeCooldown: number;
  prevSpeed: number;
  /** Header action state (v4 extraAnims; inert otherwise). */
  headerCooldown: number;
  headerHit: boolean;
  /** Receive/first-touch (and steal/intercept) action state (v4 extraAnims; inert otherwise). */
  receiveCooldown: number;
  receiveHit: boolean;
  /** Power-shot wind-up flag — true once the strike has fired (v4 extraAnims; inert otherwise). */
  powerShotHit: boolean;
  /** Seconds after the intro starts before this player begins walking on (v5 matchIntro; 0 otherwise). */
  introDelay: number;
  /** Off-pitch entrance spawn (v5 matchIntro) — where the player walks on FROM. */
  spawnX: number;
  spawnY: number;
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
  /** Last player who kicked the ball — resolves the goal scorer for celebrations. */
  lastKickerId: number | null;
  /** True while a lofted ball (cross / long ball) is in flight — gates the landing "×" marker. */
  lofted: boolean;
  /** Fixed predicted landing spot, computed once at the cross (so the "×" doesn't drift with the ball). */
  landX: number;
  landY: number;
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
  /** True while running the v5 kickoff whistle (Pause → Whistle instead of the red card). */
  kickoff: boolean;
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

/** In-progress dead-ball restart (v5 deadBallSequence). Null while the ball is live. */
export interface RestartState {
  kind: RestartKind;
  /** Team taking the restart. */
  team: Team;
  stage: RestartStage;
  /** Seconds elapsed in the current stage. */
  timer: number;
  /** Where the ball is placed once it finishes rolling out. */
  spot: Vec2;
  /** Player assigned to take the restart (set when the ball is placed). */
  takerId: number | null;
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
  /** Goal-flow phase (v4 replay features; stays Live elsewhere, opens on Intro for v5). */
  phase: MatchPhase;
  phaseTimer: number;
  /** Player id celebrating the goal — camera target while the celebration runs. */
  celebrantId: number | null;
  /** Team that scored the current goal (drives country-colored confetti). */
  scorer: Team | null;
  /** Intro sequence stage + clock (v5 matchIntro; inert while phase !== Intro). */
  introStage: IntroStage;
  introTimer: number;
  /** Active out-of-play restart (v5 deadBallSequence; null while the ball is live). */
  restart: RestartState | null;
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
  /** Keyboard control for the playable sandbox (undefined = fully AI). */
  control?: ControlInput;
  /** Id of the player currently under keyboard control (follows possession). */
  controlId: number;
}

/** Held movement keys for the controlled player (playable sandbox). */
export interface ControlInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
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
  replayActive: boolean;
  redCardActive: boolean;
  /** Scoring team of the current goal ('blue' | 'red' | ''), for country-colored confetti. */
  goalTeam: string;
  /** v5 match intro: overlay visibility + current stage (empty when not in the intro). */
  introActive: boolean;
  introStage: string;
  /** v5 dead-ball restart: banner visibility + label ('CORNER' | 'THROW-IN' | 'GOAL KICK' | ''). */
  restartActive: boolean;
  restartLabel: string;
  /** v5 team brands for the intro card (name + flag id per side; empty → generic). */
  teamBlueName: string;
  teamRedName: string;
  teamBlueFlag: string;
  teamRedFlag: string;
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
  /** Debug helper: fires the ball into the right goal so the goal/replay flow can be tested on demand. */
  debugGoal: () => void;
  /** Debug helper: forces an action anim on the nearest outfielder to review sprite sizes on demand. */
  debugAction: (kind: 'header' | 'receive' | 'intercept' | 'powershot') => void;
  /** v5: replays the pre-match entrance (teams walk on, referee whistle, kickoff). */
  playIntro: () => void;
  /** v5: forces a dead-ball restart so the corner / throw-in / goal-kick flow can be tested on demand. */
  debugRestart: (kind: 'throwin' | 'corner' | 'goalkick') => void;
  resize: () => void;
  destroy: () => void;
}
