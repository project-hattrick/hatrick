'use client';

import { useEffect } from 'react';
import { getSocket } from './socket';
import { useMatchStore, type MatchEvent } from '@/store/match.store';
import { EmissionState } from '@/enums';

/** Wires the realtime socket into stores. Base seam — extend per event type. */
export function useRealtime(): void {
  const pushEvent = useMatchStore((state) => state.pushEvent);

  useEffect(() => {
    const socket = getSocket();
    const onEvent = (payload: MatchEvent) => pushEvent(payload);

    socket.on(`match-event.${EmissionState.During}`, onEvent);
    socket.on(`match-event.${EmissionState.After}`, onEvent);

    return () => {
      socket.off(`match-event.${EmissionState.During}`, onEvent);
      socket.off(`match-event.${EmissionState.After}`, onEvent);
    };
  }, [pushEvent]);
}
