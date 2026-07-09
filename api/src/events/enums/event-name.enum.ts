/**
 * Domain event names on the EventEmitter2 bus.
 * Convention: `<domain>.<during|after>` so wildcard listeners can target
 * `*.after` (authoritative) or `goal.*` (a domain), per docs/architecture.md.
 */
export enum EventName {
  ScoreUpdateDuring = 'score-update.during',
  ScoreUpdateAfter = 'score-update.after',

  GoalDuring = 'goal.during',
  GoalAfter = 'goal.after',

  YellowCardDuring = 'yellow-card.during',
  YellowCardAfter = 'yellow-card.after',

  RedCardDuring = 'red-card.during',
  RedCardAfter = 'red-card.after',

  SubstitutionDuring = 'substitution.during',
  SubstitutionAfter = 'substitution.after',

  CornerDuring = 'corner.during',
  CornerAfter = 'corner.after',

  MatchEndAfter = 'match-end.after',

  /** Odds have no during/after split — they are continuous updates. */
  OddsUpdate = 'odds.update',

  /** Full tournament snapshot pushed to new realtime clients. */
  TournamentStateSync = 'tournament-state.sync',

  /** A limited store item was bought (stock decremented, coins debited). */
  StorePurchaseAfter = 'store-purchase.after',
}
