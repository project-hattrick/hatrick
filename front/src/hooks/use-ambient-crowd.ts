'use client';

import { useEffect } from 'react';

import { env } from '@/lib/env';
import { useCrowdStore } from '@/store/crowd.store';
import { randomCrowdMessage, startMockCrowd } from '@/services/mock/live-feed.mock';

/**
 * Keeps the Live Crowd alive during real-backend replays. The mock feed already seeds + streams the
 * crowd, so this only runs when USE_MOCK is off — it seeds a few balloons and keeps the chatter going.
 */
export function useAmbientCrowd(): void {
  useEffect(() => {
    if (env.useMock) return;
    useCrowdStore.getState().seed(Array.from({ length: 8 }, () => randomCrowdMessage()));
    return startMockCrowd();
  }, []);
}
