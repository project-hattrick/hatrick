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

export function useStopReplay() {
  return useMutation({ mutationFn: () => replayService.stop() });
}
