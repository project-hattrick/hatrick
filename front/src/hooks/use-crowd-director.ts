'use client';

import { useEffect } from 'react';

import { startCrowdDirector } from '@/lib/crowd/crowd-director';
import { ambientFanMessage } from '@/lib/crowd/fan-burst';
import { buildBotWelcome } from '@/lib/crowd/hatbot-messages';
import { CrowdSource } from '@/enums/crowd-source.enum';
import { useCrowdFeed } from '@/services/realtime/use-crowd-feed';
import { useCrowdStore } from '@/store/crowd.store';
import { useMatchStore } from '@/store/match.store';

const SEED_AGES = ['2m', '1m', '40s', '20s', '8s', 'now'];

/**
 * Mounts the crowd director (event-reactive fans + HatBot) for the lifetime of a
 * live/duel dashboard. Seeds a few balloons so the panel never opens empty.
 * Real viewer messages stream in alongside the simulated ambience (backend mode).
 *
 * `hatBotOnly` (private rooms) mutes the simulated stands: no ambient fans, no fan
 * bursts — just the single HatBot voice (commentary + betting nudges).
 */
export function useCrowdDirector(options?: { hatBotOnly?: boolean }): void {
  const hatBotOnly = options?.hatBotOnly ?? false;
  useCrowdFeed();
  useEffect(() => {
    const crowd = useCrowdStore.getState();
    const match = useMatchStore.getState().match;
    if (hatBotOnly) {
      // No fake stands in a private session — just introduce the bot so the feed isn't empty.
      if (!crowd.messages.some((message) => message.source === CrowdSource.HatBot)) {
        crowd.add(buildBotWelcome(match));
      }
    } else if (crowd.messages.length === 0) {
      crowd.seed(SEED_AGES.map((ageLabel) => ({ ...ambientFanMessage(match), ageLabel })));
    }
    return startCrowdDirector({ hatBotOnly });
  }, [hatBotOnly]);
}
