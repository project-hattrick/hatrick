/** Derived state of the user's self-exclusion from the betting surfaces. */
export enum SelfExclusionStatus {
  /** Not self-excluded — betting is available. */
  Active = 'Active',
  /** Self-excluded and still within the minimum 24h lock — cannot reactivate yet. */
  Excluded = 'Excluded',
  /** Minimum period elapsed — eligible to reactivate after a cooling-off confirmation. */
  CoolingOff = 'CoolingOff',
}
