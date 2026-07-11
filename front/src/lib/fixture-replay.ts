import type { ReplayCatalogItem } from '@/services/replay.service';
import type { FixtureDto } from '@/services/txline.service';

/** How long after kickoff a fixture still reads as in play (90' + break + stoppage headroom). */
export const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

/** TxLINE timestamps arrive in seconds or ms depending on the endpoint — normalise to ms. */
export const toMs = (value: number) => (value < 1e12 ? value * 1000 : value);

/** True while a fixture is inside its live window (kicked off, not yet past full-time + stoppage). */
export const isFixtureLive = (fixture: FixtureDto, now: number) => {
  const start = toMs(fixture.StartTime);
  return start <= now && now - start <= LIVE_WINDOW_MS;
};

/** Map an upcoming/live fixture onto the replay item the live pipeline streams through. */
export function fixtureToReplayItem(fixture: FixtureDto): ReplayCatalogItem {
  const ms = toMs(fixture.StartTime);
  return {
    fixtureId: fixture.FixtureId,
    home: fixture.Participant1,
    away: fixture.Participant2,
    competition: '',
    startTime: ms,
    epochDay: Math.floor(ms / 86_400_000),
    startHour: new Date(ms).getUTCHours(),
  };
}
