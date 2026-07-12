'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { GameState } from '@/enums/game-state.enum';
import { TeamSide } from '@/enums/team-side.enum';
import { teamInfoFromName } from '@/config/teams.config';
import { toMatchEvents } from '@/lib/fixture-actions';
import { replayService } from '@/services/replay.service';
import { backendEnabled } from '@/services/session-mode';
import { useMatchStore, type RecapSnapshot } from '@/store/match.store';

/** Same in-play window as the replay loader — anything older is a finished recap. */
const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

const RECAP_QUERY_KEY = ['recap', 'fallback'] as const;

/** Newest finished fixture from the catalog, hydrated with its authoritative score. */
async function fetchRecap(): Promise<RecapSnapshot | null> {
  const catalog = await replayService.getCatalog();
  const now = Date.now();
  const finished = catalog
    .filter((item) => item.startTime + LIVE_WINDOW_MS < now)
    .sort((a, b) => b.startTime - a.startTime)[0];
  if (!finished) return null;
  const snap = await replayService.getScore(finished.fixtureId);
  return {
    match: {
      fixtureId: finished.fixtureId,
      home: teamInfoFromName(finished.home, TeamSide.Home),
      away: teamInfoFromName(finished.away, TeamSide.Away),
      score: { home: snap.home, away: snap.away },
      minute: 90,
      gameState: GameState.FullTime,
      startTime: finished.startTime,
    },
    events: toMatchEvents(finished.fixtureId, snap.actions),
  };
}

/**
 * While the feed is dormant (no live match on screen), fetch the newest REAL
 * finished fixture and use it as the recap the home hero/scorebar display —
 * instead of the hardcoded config recap, which stays as the mock/error fallback.
 */
export function useRecapFallback(): void {
  const hasLiveMatch = useMatchStore((s) => s.match !== null);
  const setRecap = useMatchStore((s) => s.setRecap);

  const query = useQuery({
    queryKey: RECAP_QUERY_KEY,
    queryFn: fetchRecap,
    enabled: backendEnabled && !hasLiveMatch,
    staleTime: 10 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) setRecap(query.data);
  }, [query.isSuccess, query.data, setRecap]);
}
