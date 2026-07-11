'use client';

import { useEffect } from 'react';
import { env } from '@/lib/env';
import { hydrateFromMock, startMockMatchEvents } from '@/services/mock/live-feed.mock';
import { getSocket } from './socket';
import { useMatchStore } from '@/store/match.store';
import { useKickoffRollover } from '@/hooks/use-kickoff-rollover';
import { useOddsFeed } from './use-odds-feed';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEndPayload, MatchEventPayload } from '@/types/match';

const CH_MATCH_END = 'match-end.after';

/** The home's single data-subscription seam: mock now, socket later (env flag). */
export function useLiveFeed(): void {
  // Pre-match fixtures flip to live at their scheduled kickoff, even before the first event.
  useKickoffRollover();
  // Live odds book (snapshot baseline + odds.update stream) follows the current fixture.
  useOddsFeed();
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
    socket.on(`match-event.${EmissionState.During}`, onEvent);
    socket.on(`match-event.${EmissionState.After}`, onEvent);
    socket.on(CH_MATCH_END, onEnd);

    return () => {
      socket.off(`match-event.${EmissionState.During}`, onEvent);
      socket.off(`match-event.${EmissionState.After}`, onEvent);
      socket.off(CH_MATCH_END, onEnd);
    };
  }, []);
}
