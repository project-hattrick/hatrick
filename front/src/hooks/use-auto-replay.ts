'use client';

import { useEffect, useRef } from 'react';

import { env } from '@/lib/env';
import { useReplayCatalog } from '@/services/queries/use-replay';
import { useMatchStore } from '@/store/match.store';
import { useLoadReplay } from './use-load-replay';

/**
 * When nothing is live (real backend, dormant/between fixtures), auto-load the most recent finished
 * match as a replay so the hero always shows a real game instead of the static recap. One-shot; the
 * mock feed already seeds a live match, so this only runs against the real backend.
 *
 * `enabled=false` holds it off — rooms pass this while their own fixture is still resolving, so a
 * random replay never flashes in before the room's match loads.
 */
export function useAutoReplay(enabled = true): void {
  const hasMatch = useMatchStore((state) => state.match !== null);
  const catalog = useReplayCatalog(6);
  const { loadReplay } = useLoadReplay();
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled || env.useMock || loaded.current || hasMatch) return;
    const latest = catalog.data?.[0]; // catalog is sorted most-recent first
    if (!latest) return;
    loaded.current = true;
    void loadReplay(latest);
  }, [enabled, hasMatch, catalog.data, loadReplay]);
}
