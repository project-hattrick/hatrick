/** Drives the scoreboard phase + clock (mirrors the api). */
export enum GameState {
  PreMatch = 'PreMatch',
  FirstHalf = 'FirstHalf',
  HalfTime = 'HalfTime',
  SecondHalf = 'SecondHalf',
  ExtraTime = 'ExtraTime',
  FullTime = 'FullTime',
  Unknown = 'Unknown',
}
