'use client';

import { useEffect, useRef } from 'react';

import { env } from '@/lib/env';
import { useReplayCatalog, useUpcomingFixtures } from '@/services/queries/use-replay';
import { useMatchStore } from '@/store/match.store';
import { useLoadReplay } from './use-load-replay';

const toMs = (value: number) => (value < 1e12 ? value * 1000 : value);

/**
 * Points the screen at the ROOM's fixture on entry: everyone who joins (host reloading, guests via
 * invite link) lands on the same match instead of whatever their local store had. Resolves the id
 * against the upcoming fixtures + replay catalog and routes through loadReplay, which already picks
 * pre-match / live / replay mode by kickoff time. One-shot per fixture; the host can still switch.
 *
 * Returns `pending` — true from room entry until the room's match is actually ON the store (or is
 * known to be unresolvable). Callers hold their loading state on it so the widgets never flash the
 * fallback match.
 */
export function useRoomFixture(fixtureId: number | null | undefined): { pending: boolean } {
  const upcoming = useUpcomingFixtures();
  const catalog = useReplayCatalog(6);
  const { loadReplay } = useLoadReplay();
  const loadedRef = useRef<number | null>(null);
  const currentFixtureId = useMatchStore((state) => state.match?.fixtureId ?? null);

  useEffect(() => {
    if (env.useMock || fixtureId == null || loadedRef.current === fixtureId) return;
    if (useMatchStore.getState().match?.fixtureId === fixtureId) {
      loadedRef.current = fixtureId; // already watching it (e.g. the host arriving from home)
      return;
    }

    const fixture = upcoming.data?.find((f) => f.FixtureId === fixtureId);
    if (fixture) {
      const ms = toMs(fixture.StartTime);
      loadedRef.current = fixtureId;
      void loadReplay({
        fixtureId,
        home: fixture.Participant1,
        away: fixture.Participant2,
        competition: '',
        startTime: ms,
        epochDay: Math.floor(ms / 86_400_000),
        startHour: new Date(ms).getUTCHours(),
      });
      return;
    }
    const past = catalog.data?.find((game) => game.fixtureId === fixtureId);
    if (past) {
      loadedRef.current = fixtureId;
      void loadReplay(past);
    }
    // Not in either list (older than the catalog window) — leave the ambient stage as-is.
  }, [fixtureId, upcoming.data, catalog.data, loadReplay]);

  if (env.useMock || fixtureId == null || currentFixtureId === fixtureId) return { pending: false };
  // Both sources answered and neither knows the fixture — unresolvable, stop holding the screen.
  const settled = upcoming.isFetched && catalog.isFetched;
  const known =
    upcoming.data?.some((f) => f.FixtureId === fixtureId) ||
    catalog.data?.some((g) => g.fixtureId === fixtureId);
  return { pending: !settled || !!known };
}
