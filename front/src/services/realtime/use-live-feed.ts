'use client';

import { useEffect } from 'react';
import { env } from '@/lib/env';
import { hydrateFromMock, startMockMatchEvents } from '@/services/mock/live-feed.mock';
import { getSocket } from './socket';
import { useMatchStore } from '@/store/match.store';
import { useViewersStore } from '@/store/viewers.store';
import { useKickoffRollover } from '@/hooks/use-kickoff-rollover';
import { useOddsFeed } from './use-odds-feed';
import { useStatsFeed } from './use-stats-feed';
import { EmissionState } from '@/enums/emission-state.enum';
import { GlobalEvent } from '@/enums/global-event.enum';
import type { MatchEndPayload, MatchEventPayload } from '@/types/match';

const CH_MATCH_END = 'match-end.after';

/** The home's single data-subscription seam: mock now, socket later (env flag). */
export function useLiveFeed(): void {
  // Pre-match fixtures flip to live at their scheduled kickoff, even before the first event.
  useKickoffRollover();
  // Live odds book (snapshot baseline + odds.update stream) follows the current fixture.
  useOddsFeed();
  // Authoritative team-stats snapshot (polled) — the monotonic source of truth for the stat panels.
  useStatsFeed();
  useEffect(() => {
    if (env.useMock) {
      hydrateFromMock();
      // Crowd chatter is the director's job now — the mock only drives match events.
      return startMockMatchEvents();
    }

    const socket = getSocket();
    const { applyEvent, finishMatch } = useMatchStore.getState();
    const onEvent = (payload: MatchEventPayload) => applyEvent(payload);
    const onEnd = (payload: MatchEndPayload) => finishMatch(payload);
    // Real viewer count — broadcast to every socket on each connect/disconnect. Owned here (not in
    // useGlobalFeed) so the count is live on every surface that opens the feed (home/live/duel/room).
    const onViewers = (payload: { count?: number }) => {
      if (typeof payload?.count === 'number') useViewersStore.getState().setCount(payload.count);
    };
    socket.on(`match-event.${EmissionState.During}`, onEvent);
    socket.on(`match-event.${EmissionState.After}`, onEvent);
    socket.on(CH_MATCH_END, onEnd);
    socket.on(GlobalEvent.Presence, onViewers);

    return () => {
      socket.off(`match-event.${EmissionState.During}`, onEvent);
      socket.off(`match-event.${EmissionState.After}`, onEvent);
      socket.off(CH_MATCH_END, onEnd);
      socket.off(GlobalEvent.Presence, onViewers);
    };
  }, []);
}
