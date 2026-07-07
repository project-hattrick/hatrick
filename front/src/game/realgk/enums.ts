/** Engine-internal enums for the Real Match Sim GK runtime (v2). */

export enum Team {
  Blue = 'blue',
  Red = 'red',
}

export enum Role {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  ST = 'ST',
}

/** Body animation ids — values double as the `items` keys and on-disk frame prefixes. */
export enum BodyAnim {
  IdleBack = 'idle_back',
  WalkBack = 'walk_back',
  RunBack = 'run_back',
  IdleFront = 'idle_front',
  WalkFront = 'walk_front',
  RunFront = 'run_front',
  RunSide = 'run_side',
  TurnSide = 'turn_side',
  StopBrake = 'stop_brake',
  ArmsUpRun = 'player_armsup_run_front',
  HeaderFront = 'header',
  ReceiveFront = 'receive_foot',
  InterceptFront = 'intercept',
  PowerShotFront = 'power_shot',
  PowerShotBack = 'power_shot_back',
  PowerShotSide = 'side_shot',
  /** Slide tackle (carrinho) — side-view headless 6-frame lunge; head composited (persona/generic). */
  SlideTackle = 'slide_tackle',
  /** Regen body-only front shot (headless) — persona casting composites the head; drives the persona strike. */
  ShotFront = 'shot_front',
  /** Regen body-only rear shot (headless) — the away-facing persona strike (back head composited). */
  ShotBack = 'shot_back',
  CelebrateJump = 'celebrate_jump',
  KneeSlide = 'celebrate_knee_slide',
  KneeRise = 'celebrate_knee_rise',
  KneeJump = 'celebrate_knee_jump',
  GkIdle = 'gk_idle_34',
  GkReady = 'gk_ready_34',
  GkShuffle = 'gk_shuffle_34',
  GkRunSide = 'gk_run_side',
  GkDive = 'gk_dive_save',
  GkDiveV2 = 'gk_dive_v2',
  /** Light save (carrinho do goleiro) — 3/4-front reflex block, headless 4-frame; head composited. */
  GkLightSave = 'gk_light_save',
  /** Compact lateral dive — headless 6-frame, crouch → extend → prone; head composited (aspect-normalized). */
  GkDiveCompact = 'gk_dive_compact',
}

export enum HeadView {
  Front = 'front',
  Back = 'back',
  Side = 'side',
  FrontClosed = 'frontClosed',
  FrontNeutral = 'frontNeutral',
  FrontFocus = 'frontFocus',
}

export enum RefMode {
  Idle = 'idle',
  Walk = 'walk',
  WalkSide = 'walk_side',
  Whistle = 'whistle',
  Red = 'red',
}

export enum RefPhase {
  Patrol = 'patrol',
  PatrolPause = 'patrol_pause',
  RunCenter = 'run_center',
  Pause = 'pause',
  /** Kickoff whistle at center (v5 intro) — the peaceful counterpart to Card. */
  Whistle = 'whistle',
  Card = 'card',
  ReturnPatrol = 'return_patrol',
}

export enum PlayerAction {
  None = 'none',
  Dive = 'dive',
  TurnSide = 'turn_side',
  StopBrake = 'stop_brake',
  Header = 'header',
  Receive = 'receive',
  PowerShot = 'power_shot',
  SlideTackle = 'slide_tackle',
  Celebrate = 'celebrate',
}

export enum CoachMode {
  Idle = 'idle',
  Angry = 'angry',
}

export enum BallEffectKind {
  Dust = 'dust',
  Turf = 'turf',
}

export enum ShotEffectStyle {
  PixelRing = 'pixel_ring',
  DoublePulse = 'double_pulse',
  RadialBurst = 'radial_burst',
  PowerArc = 'power_arc',
  GlitchHalo = 'glitch_halo',
}

export enum KickIntent {
  Pass = 'pass',
  Shot = 'shot',
  Header = 'header',
}

/** Top-level match flow. v2/v3 never leave Live; v4's goal flow walks the replay ring; v5 opens on Intro. */
export enum MatchPhase {
  /** Pre-match entrance: team+flag showcase, players walking on, referee whistle (v5 matchIntro only). */
  Intro = 'intro',
  Live = 'live',
  Celebration = 'celebration',
  ReplayIn = 'replay_in',
  Replay = 'replay',
  ReplayOut = 'replay_out',
}

/** Stages of the v5 match intro (drives the sim state machine + the overlay copy). */
export enum IntroStage {
  /** Broadcast card: both teams + flags on screen, camera wide. */
  Showcase = 'showcase',
  /** Camera pulls out to full pitch and glides across the perimeter sponsor boards. */
  SponsorSweep = 'sponsor_sweep',
  /** Players walk on from below the pitch to their formation homes, staggered back-to-front. */
  RiseIn = 'rise_in',
  /** Referee runs to center and blows the whistle. */
  RefWhistle = 'ref_whistle',
  /** Ball is placed at center and handed to the kickoff team — the last beat before Live. */
  Kickoff = 'kickoff',
}

/** Out-of-play restart type (v5 deadBallSequence). Kickoff is handled by the intro, not here. */
export enum RestartKind {
  None = 'none',
  ThrowIn = 'throw_in',
  Corner = 'corner',
  GoalKick = 'goal_kick',
  /** Awarded for a foul outside the box (v5 fouls). */
  FreeKick = 'free_kick',
  /** Awarded for a foul inside the offender's own box (v5 fouls). */
  Penalty = 'penalty',
}

/** Stages of a v5 dead-ball restart: the ball rolls out, a taker is set up, then it's put back in play. */
export enum RestartStage {
  /** Play frozen at the foul: the victim goes down, everyone stops (fouls only). */
  FoulFreeze = 'foul_freeze',
  /** Referee runs to the foul and whistles or brandishes the red card (fouls only). */
  RefArrive = 'ref_arrive',
  /** Ball keeps rolling off the pitch (no teleport) while the banner shows. */
  BallOut = 'ball_out',
  /** Ball placed at the correct spot; the taker walks over, everyone takes set-piece positions. */
  Setup = 'setup',
  /** Everyone is set — a short broadcast hold; the penalty run-up happens here. */
  Ready = 'ready',
  /** Taker strikes the ball back into play; the match resumes. */
  Taking = 'taking',
}

export enum CelebrationKind {
  None = 'none',
  ArmsUp = 'arms_up',
  Knee = 'knee',
}

export enum CelebrationPhase {
  None = 'none',
  Run = 'run',
  Pose = 'pose',
  Jump = 'jump',
  Loop = 'loop',
  KneeEntry = 'knee_entry',
  KneeSlide = 'knee_slide',
  KneeRise = 'knee_rise',
  KneeJump = 'knee_jump',
  KneeLoop = 'knee_loop',
}
