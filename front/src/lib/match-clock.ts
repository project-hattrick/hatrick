/** Rough in-play minute from wall-clock elapsed since kickoff — discounts the half-time break past the hour mark. */
export const estimateMinute = (elapsedMs: number): number => {
  const elapsed = Math.floor(elapsedMs / 60_000);
  return Math.max(0, Math.min(90, elapsed > 60 ? elapsed - 15 : elapsed));
};
