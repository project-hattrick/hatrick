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
  CelebrateJump = 'celebrate_jump',
  KneeSlide = 'celebrate_knee_slide',
  KneeRise = 'celebrate_knee_rise',
  KneeJump = 'celebrate_knee_jump',
  GkIdle = 'gk_idle_34',
  GkReady = 'gk_ready_34',
  GkShuffle = 'gk_shuffle_34',
  GkRunSide = 'gk_run_side',
  GkDive = 'gk_dive_save',
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
  Celebrate = 'celebrate',
}

export enum CoachMode {
  Idle = 'idle',
  Angry = 'angry',
}

/** Top-level match flow. v2/v3 never leave Live; v4's goal flow walks the full ring. */
export enum MatchPhase {
  Live = 'live',
  Celebration = 'celebration',
  ReplayIn = 'replay_in',
  Replay = 'replay',
  ReplayOut = 'replay_out',
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
