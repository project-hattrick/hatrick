'use client';

import { useEffect } from 'react';
import { getSocket } from './socket';
import { useMatchStore } from '@/store/match.store';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEventPayload } from '@/types/match';

/** Real socket → match store. Future path; the home runs on the mock feed for now. */
export function useRealtime(): void {
  const applyEvent = useMatchStore((state) => state.applyEvent);

  useEffect(() => {
    const socket = getSocket();
    const onEvent = (payload: MatchEventPayload) => applyEvent(payload);

    socket.on(`match-event.${EmissionState.During}`, onEvent);
    socket.on(`match-event.${EmissionState.After}`, onEvent);

    return () => {
      socket.off(`match-event.${EmissionState.During}`, onEvent);
      socket.off(`match-event.${EmissionState.After}`, onEvent);
    };
  }, [applyEvent]);
}
