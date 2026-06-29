/** Discriminator on MatchEventPayload.action (mirrors the api). */
export enum MatchAction {
  Goal = 'Goal',
  YellowCard = 'YellowCard',
  RedCard = 'RedCard',
  Substitution = 'Substitution',
  Corner = 'Corner',
  FreeKick = 'FreeKick',
  Penalty = 'Penalty',
  Var = 'VAR',
  Possession = 'Possession',
  Unknown = 'Unknown',
}
