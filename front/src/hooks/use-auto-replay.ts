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
 */
export function useAutoReplay(): void {
  const hasMatch = useMatchStore((state) => state.match !== null);
  const catalog = useReplayCatalog(6);
  const { loadReplay } = useLoadReplay();
  const loaded = useRef(false);

  useEffect(() => {
    if (env.useMock || loaded.current || hasMatch) return;
    const latest = catalog.data?.[0]; // catalog is sorted most-recent first
    if (!latest) return;
    loaded.current = true;
    void loadReplay(latest);
  }, [hasMatch, catalog.data, loadReplay]);
}
