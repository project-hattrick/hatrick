/** Coarse match phase, normalized from TxLINE `gameState`. */
export enum GameState {
  PreMatch = 'PreMatch',
  FirstHalf = 'FirstHalf',
  HalfTime = 'HalfTime',
  SecondHalf = 'SecondHalf',
  ExtraTime = 'ExtraTime',
  FullTime = 'FullTime',
  Unknown = 'Unknown',
}
