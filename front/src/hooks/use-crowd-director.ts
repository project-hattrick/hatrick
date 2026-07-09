'use client';

import { useEffect } from 'react';

import { startCrowdDirector } from '@/lib/crowd/crowd-director';
import { ambientFanMessage } from '@/lib/crowd/fan-burst';
import { useCrowdStore } from '@/store/crowd.store';
import { useMatchStore } from '@/store/match.store';

const SEED_AGES = ['2m', '1m', '40s', '20s', '8s', 'now'];

/**
 * Mounts the crowd director (event-reactive fans + HatBot) for the lifetime of a
 * live/duel dashboard. Seeds a few balloons so the panel never opens empty.
 */
export function useCrowdDirector(): void {
  useEffect(() => {
    const crowd = useCrowdStore.getState();
    if (crowd.messages.length === 0) {
      const match = useMatchStore.getState().match;
      crowd.seed(SEED_AGES.map((ageLabel) => ({ ...ambientFanMessage(match), ageLabel })));
    }
    return startCrowdDirector();
  }, []);
}
