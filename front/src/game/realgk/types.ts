import type { RealGkConfig } from './config';
import type { BallEffectKind, BodyAnim, CelebrationKind, CelebrationPhase, CoachMode, DrivenDirective, DrivenPhase, IntroStage, KickIntent, MatchPhase, PlayerAction, RefMode, RefPhase, RestartKind, RestartStage, Role, ShotEffectStyle, Team } from './enums';
import type { DrivenClock } from './sim/driven-clock';
import type { FeelFxState, PlayerFeelState, RealGkFeel } from './sim/feel';

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
  /** Slide tackle (carrinho) state — `slideHit` fires once at the poke frame. */
  slideCooldown: number;
  slideHit: boolean;
  /** Seconds after the intro starts before this player begins walking on (v5 matchIntro; 0 otherwise). */
  introDelay: number;
  /** Off-pitch entrance spawn (v5 matchIntro) — where the player walks on FROM. */
  spawnX: number;
  spawnY: number;
  /** Which persona head set this player wears (`features.personaHeads`); ignored otherwise. */
  personaId: number;
  /** Driven shot: overrides the strike aim so the shot matches the feed outcome (wide / woodwork).
   *  Null/undefined = aim on target (at the keeper). Cleared when the shot resolves. */
  drivenShotAim?: Vec2 | null;
  /** Feel-experiment scratch state (France GK sandbox); inert while every `world.feel` flag is off. */
  feel: PlayerFeelState;
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

export interface BallEffectParticle {
  kind: BallEffectKind;
  x: number;
  y: number;
  lift: number;
  vx: number;
  vy: number;
  vlift: number;
  age: number;
  life: number;
  size: number;
  color: string;
}

export interface BallEffectsState {
  particles: BallEffectParticle[];
  shots: ShotEffectPulse[];
  shotStyle: ShotEffectStyle;
  slowMoTimer: number;
}

export interface ShotEffectPulse {
  style: ShotEffectStyle;
  x: number;
  y: number;
  angle: number;
  strength: number;
  age: number;
  life: number;
}

export interface BallKickOptions {
  intent?: KickIntent;
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
  /** v5 fouls: whistle at the pause without the kickoff status (a plain foul call, no card). */
  whistleOnly: boolean;
  /** Run-in speed for the RunCenter phase (bumped for foul sprints). */
  runSpeed: number;
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

/** The foul behind a free kick / penalty restart (v5 fouls). */
export interface FoulInfo {
  offenderId: number;
  victimId: number;
  /** True = straight red: play freezes on the card and the offender is sent off. */
  card: boolean;
  /** Where the foul happened — the referee runs here (the kick spot may differ for penalties). */
  at: Vec2;
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
  /** Per-player set-piece positions, computed once when the ball is placed (stable targets). */
  targets?: Record<number, Vec2>;
  /** Present when the restart came from a foul (free kick / penalty). */
  foul?: FoulInfo;
  /** Pre-computed strike, set at the Taking transition so the taker's wind-up pose and the actual
   *  kick agree (recomputing would re-roll the random target between pose and contact). */
  strike?: { target: Vec2; power: number; lob: boolean };
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
  /** Feed-driven buffering hold: the intro loops HoldLoop after RiseIn until this clears (first event). */
  introHold: boolean;
  /** Active out-of-play restart (v5 deadBallSequence; null while the ball is live). */
  restart: RestartState | null;
  /** Real seconds until the next foul may be called (v5 fouls; inert otherwise). */
  foulCooldown: number;
  /** Feed-driven card broadcast: bumped once per carded event so the HUD can pulse a card graphic. */
  cardFlashSeq: number;
  /** Colour of the most recent card ('' until the first one). */
  cardFlashColor: '' | 'yellow' | 'red';
  /** Team the most recent card was shown to ('' until the first one). */
  cardFlashTeam: '' | Team;
}

/** All mutable v2 state. Mutated by the loop; lives outside React. */
export interface RealGkWorld {
  players: RealGkPlayer[];
  nextPlayerId: number;
  ball: Ball;
  ballEffects: BallEffectsState;
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
  /** Sandbox override for which dive pack keepers play (Q/E and AI). Unset = config feature flags. */
  divePackOverride?: BodyAnim;
  /** Names of players sent off this match — kept off the pitch across kickoff resets (v5 fouls). */
  sentOffNames: string[];
  /**
   * Feed-driven mode: when true, the external match feed dictates goals/shots/score/cards and the
   * autonomous outcome AI is suppressed. Lives on the root world (not `match`) so it survives the
   * kickoff resets that zero `match` after each injected goal — only `setDriven` flips it.
   */
  driven: boolean;
  /** Which team the feed says is pressing + how threatening (0..1). Steers the shape while `driven`. */
  intent: DrivenIntent;
  /** Feed-driven match clock state (null → attract mode, clock ticks at TIME_SCALE). */
  drivenClock: DrivenClock | null;
  /**
   * Short window after the feed hands possession to a team: that team's receivers get trap/claim
   * priority so the pass launched by the driver lands with the intended side (no instant snaps).
   */
  possessionGrant: PossessionGrant | null;
  /** Seconds until the next driven-filler autonomous shot may fire (`features.drivenFiller`). */
  fillerShotCooldown: number;
  /** Feed directives that arrived during the intro — flushed onto the pitch at kickoff. */
  pendingDirectives: PendingDirective[];
  /** Set when a driven shot is OffTarget: the next ball to cross a byline is a GOAL KICK to this team
   *  (the defender), overriding the engine's attacker-touch → corner rule so a wide shot reads as a miss. */
  drivenShotWide?: Team | null;
  /** Keeper-feel experiment flags (seeded via cfg.feel; toggled live by handle.setFeel). */
  feel: RealGkFeel;
  /** One-shot feel effects consumed by the loop: sim hitstop + camera-shake request. */
  feelFx: FeelFxState;
}

/** A queued feed directive (see `sim/directives.ts`). */
export interface PendingDirective {
  kind: DrivenDirective;
  team: Team;
  threat: number;
  /** Card directives only: true = red card, false/undefined = yellow. */
  red?: boolean;
  /** Shot directives only: the feed shot outcome string (OnTarget / OffTarget / Woodwork / Blocked). */
  outcome?: string;
}

/** See RealGkWorld.possessionGrant. */
export interface PossessionGrant {
  team: Team;
  timer: number;
}

/** Held movement keys for the controlled player (playable sandbox). */
export interface ControlInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/**
 * Feed-driven mode intent (mirrors the headsonly engine). While `driven`, the match OUTCOMES (goals,
 * shots, score, cards) come from the external match feed instead of the autonomous AI — `attackingTeam`
 * + `threat` (0..1, decays over ~7s) bias the on-pitch shape toward the team the feed says is pressing.
 */
export interface DrivenIntent {
  attackingTeam: Team | null;
  threat: number;
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
  /** v5 dead-ball restart: banner visibility + label ('CORNER' | 'THROW-IN' | 'GOAL KICK' | 'FREE KICK' | 'PENALTY' | 'FOUL' | ''). */
  restartActive: boolean;
  restartLabel: string;
  /** Team taking the current restart ('blue' | 'red' | '') — colors the banner. */
  restartTeam: string;
  /** Name of the player shown the red card ('' when none / not a foul card). */
  redCardName: string;
  /** Feed-driven card broadcast: monotonic counter (pulse trigger) + colour + team for the card overlay. */
  cardFlashSeq: number;
  cardFlashColor: string;
  cardFlashTeam: string;
  /** Match-structure beats (`features.matchStructure`): interval break + final-whistle result overlay. */
  halfTimeActive: boolean;
  fullTimeActive: boolean;
  /** Winning team at full time ('blue' | 'red' | '' for a draw / not full time). */
  winnerTeam: string;
  /** v5 team brands for the intro card (name + flag id per side; empty → generic). */
  teamBlueName: string;
  teamRedName: string;
  teamBlueFlag: string;
  teamRedFlag: string;
  cameraLabel: string;
  targetLabel: string;
  shotEffectLabel: string;
}

export type RealGkHudPatch = Partial<RealGkHud>;

/** One dot for the room's 2D radar: field-ratio position (0..1) + which side it belongs to. */
export interface RealGkRadarActor {
  /** Along the pitch length: 0 = Blue/home goal end, 1 = Red/away goal end. */
  lat: number;
  /** Across the pitch: 0 = far touchline, 1 = near touchline. */
  depth: number;
  home: boolean;
}

/** Live snapshot of every player + the ball, in field ratios — feeds the room mini-pitch radar. */
export interface RealGkRadar {
  actors: RealGkRadarActor[];
  ball: { lat: number; depth: number };
}

export interface RealGkHandle {
  togglePause: () => void;
  cycleSpeed: () => void;
  /** Toggles the 2D (flat) render: constant sprite size + squashed pitch. */
  setFlat: (value: boolean) => void;
  cycleCamera: () => void;
  cycleTarget: () => void;
  /** Playable sandbox helper: cycles keyboard control between available blue test actors. */
  cycleControlledPlayer: () => string;
  /** Manual keeper dive for the controlled keeper (side < 0 = top post, > 0 = bottom post). */
  keeperDive: (side: -1 | 1) => boolean;
  /** GK-control helper: fires a shot at the blue keeper's goal so saves can be practiced on demand. */
  debugIncomingShot: () => void;
  /** GK debug: plays a specific dive pack on the blue keeper through the real dive machinery. */
  debugKeeperDive: (variant: 'compact' | 'save' | 'v2') => void;
  /** Sandbox knob: pins which dive pack Q/E (and AI keepers) play. 'auto' = config feature flags. */
  setKeeperDivePack: (variant: 'auto' | 'compact' | 'save' | 'v2') => void;
  /** Feel lab: flips keeper-feel experiment flags live (no engine reboot). */
  setFeel: (patch: Partial<RealGkFeel>) => void;
  restart: () => void;
  spawnReferee: () => void;
  /** Debug helper: fires the ball into the right goal so the goal/replay flow can be tested on demand. */
  debugGoal: () => void;
  /** Effects lab helper: releases a high ball at midfield to exercise repeated ground impacts. */
  debugBallDrop: () => void;
  /** Effects lab helper: selects the next shot-contact visual. */
  cycleShotEffect: () => void;
  /** Debug helper: forces an action anim on the nearest outfielder to review sprite sizes on demand. */
  debugAction: (kind: 'header' | 'receive' | 'intercept' | 'powershot') => void;
  /** v5: replays the pre-match entrance (teams walk on, referee whistle, kickoff). */
  playIntro: () => void;
  /** v5: forces a dead-ball restart so the corner / throw-in / goal-kick flow can be tested on demand. */
  debugRestart: (kind: 'throwin' | 'corner' | 'goalkick') => void;
  /** v5: forces a foul (free kick / penalty / straight red) so the sanction flow can be tested on demand. */
  debugFoul: (kind: 'free' | 'penalty' | 'red') => void;
  // ---- feed director (drives the sim from an external match event stream; mirrors HeadsOnlyHandle) ----
  /** Match switch: run the cinematic entrance and hold its camera loop until `setDriven(true)` releases it. */
  beginDrivenIntro: () => void;
  /** Enter/leave feed-driven mode (suppresses autonomous goals, shots, steals and fouls). */
  setDriven: (on: boolean) => void;
  /** The team currently on the ball + how threatening (0..1). Steers the whole shape. */
  setPossession: (team: Team, threat: number) => void;
  /** Commit a shot on goal from the attacking team. `outcome` (feed) picks wide / woodwork / on-target. */
  injectShot: (team: Team, outcome?: string) => void;
  /** Celebrate a goal (score comes from setScore — the feed is authoritative). */
  injectGoal: (team: Team) => void;
  /** Stage a corner for the attacking team. */
  injectCorner: (team: Team) => void;
  /** Card for a team — `red` picks the red-card broadcast (default yellow) and sends a player off. */
  injectCard: (team: Team, red?: boolean) => void;
  /** Stage a feed-awarded penalty (spot kick + box staging). */
  injectPenalty: (team: Team) => void;
  /** Stage a feed-awarded free kick with a wall (`danger` 0..1 biases how close to goal it's placed). */
  injectFreeKick: (team: Team, danger?: number) => void;
  /** Authoritative scoreboard (Blue = home / participant 1, Red = away / participant 2). */
  setScore: (blue: number, red: number) => void;
  /** Authoritative match minute from the feed — the driven clock sweeps toward it. */
  setClock: (minute: number) => void;
  /** Match structure from the feed: half-time break, final whistle, (second-half) kickoff resume.
   *  No-op unless the variant sets `features.matchStructure`. */
  setPhase: (phase: DrivenPhase) => void;
  /** Live field-ratio snapshot of all players + the ball, for the room's 2D radar (mini-pitch). */
  sampleRadar: () => RealGkRadar;
  /** Activity gate: `false` stops the RAF loop entirely (tab hidden / backdrop off-screen), `true` resumes it. */
  setActive: (active: boolean) => void;
  resize: () => void;
  destroy: () => void;
}
