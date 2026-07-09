'use client';

import { useEffect } from 'react';
import { env } from '@/lib/env';
import { hydrateFromMock, startMockMatchEvents } from '@/services/mock/live-feed.mock';
import { getSocket } from './socket';
import { useMatchStore } from '@/store/match.store';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEventPayload } from '@/types/match';

/** The home's single data-subscription seam: mock now, socket later (env flag). */
export function useLiveFeed(): void {
  useEffect(() => {
    if (env.useMock) {
      hydrateFromMock();
      // Crowd chatter is the director's job now — the mock only drives match events.
      return startMockMatchEvents();
    }

    const socket = getSocket();
    const applyEvent = useMatchStore.getState().applyEvent;
    const onEvent = (payload: MatchEventPayload) => applyEvent(payload);
    socket.on(`match-event.${EmissionState.During}`, onEvent);
    socket.on(`match-event.${EmissionState.After}`, onEvent);

    return () => {
      socket.off(`match-event.${EmissionState.During}`, onEvent);
      socket.off(`match-event.${EmissionState.After}`, onEvent);
    };
  }, []);
}
