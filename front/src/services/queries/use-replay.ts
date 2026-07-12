import { useMutation, useQuery } from '@tanstack/react-query';

import { replayService, type StartReplayInput } from '@/services/replay.service';
import { queryKeys } from './keys';

/** Finished fixtures available to replay (past matches). */
export function useReplayCatalog(days = 6) {
  return useQuery({
    queryKey: queryKeys.replayCatalog(days),
    queryFn: () => replayService.getCatalog(days),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Upcoming fixtures (go live at kickoff). */
export function useUpcomingFixtures() {
  return useQuery({
    queryKey: queryKeys.fixtures(),
    queryFn: () => replayService.getUpcoming(),
  });
}

export function useStartReplay() {
  return useMutation({ mutationFn: (input: StartReplayInput) => replayService.start(input) });
}

/** On-demand authoritative score for a fixture (snapshot baseline). */
export function useFixtureScore() {
  return useMutation({ mutationFn: (fixtureId: number) => replayService.getScore(fixtureId) });
}

/** Whole-match timeline for a finished fixture (every notable event + final score). */
export function useFixtureTimeline(input: { fixtureId: number; epochDay: number; startHour: number } | null) {
  return useQuery({
    queryKey: ['fixture-timeline', input?.fixtureId, input?.epochDay, input?.startHour],
    queryFn: () => replayService.getTimeline(input as { fixtureId: number; epochDay: number; startHour: number }),
    enabled: input != null,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Authoritative score snapshot for a fixture — replay surfaces show the FINAL result, not the playback minute. */
export function useFixtureScoreQuery(fixtureId: number | null) {
  return useQuery({
    queryKey: ['fixture-score', fixtureId],
    queryFn: () => replayService.getScore(fixtureId as number),
    enabled: fixtureId != null,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Authoritative team-stats snapshot for a fixture (shots, cards, corners…), tallied from the FULL
 * scores snapshot on the backend so it never regresses. Polls every 15s to self-heal the live tally.
 */
export function useFixtureStatsQuery(fixtureId: number | null) {
  return useQuery({
    queryKey: ['fixture-stats', fixtureId],
    queryFn: () => replayService.getStats(fixtureId as number),
    enabled: fixtureId != null,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Latest odds snapshot for one fixture (pre-match boards). Books reprice slowly pre-match. */
export function useFixtureOdds(fixtureId: number) {
  return useQuery({
    queryKey: ['fixture-odds', fixtureId],
    queryFn: () => replayService.getOdds(fixtureId),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useStopReplay() {
  return useMutation({ mutationFn: () => replayService.stop() });
}
