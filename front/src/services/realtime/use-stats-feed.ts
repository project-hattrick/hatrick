'use client';

import { useEffect } from 'react';

import { env } from '@/lib/env';
import { useFixtureStatsQuery } from '@/services/queries/use-replay';
import { useMatchStore, type LiveMatchStats } from '@/store/match.store';
import type { FixtureStats } from '@/services/replay.service';

/** Backend stats snapshot → the store's LiveMatchStats shape (possession is not provided by the feed). */
function toLiveStats(s: FixtureStats): LiveMatchStats {
  return {
    shots: s.shots,
    shotsOnTarget: s.shotsOnTarget,
    fouls: s.fouls,
    corners: s.corners,
    yellowCards: s.yellowCards,
    redCards: s.redCards,
    offsides: s.offsides,
    possessionEvents: { home: 0, away: 0 },
  };
}

/**
 * Polls the backend's authoritative team-stats snapshot for the current LIVE fixture and folds it
 * into the store as the monotonic source of truth (`setAuthoritativeStats`). Disabled for mock and
 * front-driven replays — those build their tally up locally and must not jump to final totals.
 */
export function useStatsFeed(): void {
  const fixtureId = useMatchStore((s) => s.match?.fixtureId ?? null);
  const isReplay = useMatchStore((s) => s.isReplay);
  const liveId = !env.useMock && !isReplay && fixtureId != null ? fixtureId : null;
  const { data } = useFixtureStatsQuery(liveId);
  useEffect(() => {
    if (data) useMatchStore.getState().setAuthoritativeStats(data.fixtureId, toLiveStats(data));
  }, [data]);
}
