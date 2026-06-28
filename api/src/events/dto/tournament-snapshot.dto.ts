/** Snapshot sent to new realtime clients. Generic base — extend as needed. */
export interface TournamentSnapshot {
  fixtures: number[];
  updatedAt: number;
}
