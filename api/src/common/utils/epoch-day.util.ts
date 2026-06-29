/** Pure date helpers. TxLINE historical/snapshot endpoints key off `epochDay`
 *  (whole days since 1970-01-01 UTC) — see docs/txline-provider.md. */

const MS_PER_DAY = 86_400_000;

/** Days since the Unix epoch, in UTC. */
export function toEpochDay(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

/** Midnight UTC for a given epochDay. */
export function fromEpochDay(epochDay: number): Date {
  return new Date(epochDay * MS_PER_DAY);
}
