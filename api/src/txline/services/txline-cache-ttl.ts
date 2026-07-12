/**
 * Cache TTL policy for TxLINE reads (seconds). Named per endpoint so call sites
 * never carry magic numbers. Rationale: snapshots go stale in seconds during a
 * live match, but a historical 5-minute interval is IMMUTABLE once it has fully
 * passed — replays re-read the same intervals over and over, so caching them is
 * where the infrastructure savings really are.
 */
export const TxlineCacheTtl = {
  /** Fixture list moves slowly; the ingest sweep polls it — 60s keeps it one call per cycle. */
  FixturesSnapshot: 60,
  /** Live score snapshot — short so the /score endpoint stays honest mid-match. */
  ScoresSnapshot: 15,
  /** Live odds snapshot. */
  OddsSnapshot: 20,
  /** Point-in-time odds snapshot (asOf bucketed to the 5-min interval → stable key). */
  OddsSnapshotAsOf: 300,
  /** A finished historical 5-min interval never changes. */
  HistoricalInterval: 24 * 3600,
  /** Bypass the cache entirely. */
  None: 0,
} as const;

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const INTERVAL_MS = 300_000;
/** Grace after an interval closes before we trust it as immutable (late boundary writes). */
const IMMUTABLE_GRACE_MS = 60_000;

/** UTC epoch-ms when a 5-min interval ends. */
export function intervalEndMs(epochDay: number, hour: number, interval: number): number {
  return epochDay * DAY_MS + hour * HOUR_MS + (interval + 1) * INTERVAL_MS;
}

/** Long TTL for finished intervals; no caching while the interval is still current/future. */
export function historicalIntervalTtl(
  epochDay: number,
  hour: number,
  interval: number,
  now = Date.now(),
): number {
  return intervalEndMs(epochDay, hour, interval) + IMMUTABLE_GRACE_MS <= now
    ? TxlineCacheTtl.HistoricalInterval
    : TxlineCacheTtl.None;
}
