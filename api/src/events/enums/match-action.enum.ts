/** Normalized match actions derived from TxLINE `dataSoccer.Action` / flags. */
export enum MatchAction {
  Goal = 'Goal',
  YellowCard = 'YellowCard',
  RedCard = 'RedCard',
  Substitution = 'Substitution',
  Corner = 'Corner',
  FreeKick = 'FreeKick',
  Penalty = 'Penalty',
  Shot = 'Shot',
  Var = 'VAR',
  Possession = 'Possession',
  Unknown = 'Unknown',
}
