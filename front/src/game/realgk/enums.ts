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
}

export enum CoachMode {
  Idle = 'idle',
  Angry = 'angry',
}
