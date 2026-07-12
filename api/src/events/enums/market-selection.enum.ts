/**
 * Wire ids for a bet's `selection` field, as sent by the frontend bet slip.
 * MatchResult uses Home/Draw/Away; TotalGoals uses Over/Under (fixed 2.5 line).
 */
export enum MarketSelection {
  Home = 'home',
  Draw = 'draw',
  Away = 'away',
  Over = 'over',
  Under = 'under',
}
