/** Rolling window a responsible-gaming stake limit applies to. */
export enum StakePeriod {
  Daily = 'Daily',
  Weekly = 'Weekly',
}

/** Outcome of changing a stake limit — drives the confirmation copy. */
export enum StakeLimitOutcome {
  /** Reduction or a brand-new cap — effective immediately. */
  Applied = 'Applied',
  /** Increase or removal — deferred by the 24h review window. */
  Scheduled = 'Scheduled',
  /** No change (same value). */
  Unchanged = 'Unchanged',
}
