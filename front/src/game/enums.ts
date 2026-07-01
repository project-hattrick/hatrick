/** Engine-internal enums. Kept here (not in src/enums) because the game is framework-free. */

export enum Team {
  Blue = 'B',
  Red = 'R',
}

export enum Role {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD',
}

/** High-level match phase that gates the update loop. */
export enum Phase {
  Intro = 'intro',
  Play = 'play',
}

export enum ActorKind {
  Outfield = 'outfield',
  Goalkeeper = 'goalkeeper',
}

/** Folder-name values double as the on-disk sprite directory under actors/outfield/<team>/. */
export enum OutfieldAnim {
  Idle = 'idle',
  Run = 'run',
  Kick = 'kick',
  Tackle = 'tackle',
  Celebrate = 'celebrate',
}

/** Folder-name values double as the on-disk sprite directory under actors/goalkeeper/. */
export enum GoalkeeperAnim {
  Ready = 'ready',
  Shuffle = 'shuffle',
  Run = 'run',
  CatchHigh = 'catch-high',
  SaveLow = 'save-low',
  DiveFull = 'dive-full',
  GoalKick = 'goal-kick',
}

export enum StadiumKey {
  RainCourt = 'rain-court',
}

export enum CameraMode {
  Zoom23 = 'zoom-2.3',
  Zoom3 = 'zoom-3',
  Zoom17 = 'zoom-1.7',
  FullField = 'full-field',
}

export enum RainLevel {
  Off = 0,
  Medium = 1,
  Strong = 2,
}
