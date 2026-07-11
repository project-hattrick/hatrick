'use client';

import { useEffect } from 'react';

import { env } from '@/lib/env';
import { replayService } from '@/services/replay.service';
import { useMatchStore } from '@/store/match.store';
import { useOddsStore } from '@/store/odds.store';
import { getSocket } from './socket';
import type { OddsEventPayload } from '@/types/match';

const CH_ODDS = 'odds.update';

/**
 * Keeps the live odds book in sync with the current match: on every fixture switch it re-points
 * the book and seeds it from the REST odds snapshot, then folds the socket's `odds.update`
 * stream on top. Mock mode keeps the static config odds (empty book = fallback).
 */
export function useOddsFeed(): void {
  const fixtureId = useMatchStore((state) => state.match?.fixtureId ?? null);

  // Baseline per fixture.
  useEffect(() => {
    useOddsStore.getState().reset(fixtureId);
    if (fixtureId == null || env.useMock) return;
    let cancelled = false;
    replayService
      .getOdds(fixtureId)
      .then((items) => {
        if (!cancelled) useOddsStore.getState().baseline(fixtureId, items);
      })
      .catch(() => {
        // No snapshot (endpoint down / no odds yet) — the live stream still populates the book.
      });
    return () => {
      cancelled = true;
    };
  }, [fixtureId]);

  // Live updates (the store drops fixtures that aren't on screen).
  useEffect(() => {
    if (env.useMock) return;
    const socket = getSocket();
    const onOdds = (payload: OddsEventPayload) => useOddsStore.getState().applyUpdate(payload);
    socket.on(CH_ODDS, onOdds);
    return () => {
      socket.off(CH_ODDS, onOdds);
    };
  }, []);
}
