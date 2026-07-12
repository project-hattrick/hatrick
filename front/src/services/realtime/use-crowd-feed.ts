'use client';

import { useEffect } from 'react';

import { CrowdEvent } from '@/enums/crowd-event.enum';
import { CrowdSource } from '@/enums/crowd-source.enum';
import { TeamSide } from '@/enums/team-side.enum';
import { crowdCountries } from '@/config/crowd-pool.config';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { useCrowdStore } from '@/store/crowd.store';
import { useMatchStore } from '@/store/match.store';
import type { CrowdMessage } from '@/types/crowd';
import { getSocket } from './socket';

/** Wire payload broadcast by the api crowd gateway. */
interface CrowdMessageWire {
  id: string;
  userId: string;
  author: string;
  country: string | null;
  text: string;
  fixtureId: number | null;
  ts: number;
}

/** Stable small hash so the same sender always lands on the same side/avatar. */
function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function toCrowdMessage(wire: CrowdMessageWire): CrowdMessage {
  const match = useMatchStore.getState().match;
  const side =
    wire.country && match
      ? wire.country === match.home.code
        ? TeamSide.Home
        : wire.country === match.away.code
          ? TeamSide.Away
          : hashCode(wire.userId) % 2 === 0
            ? TeamSide.Home
            : TeamSide.Away
      : hashCode(wire.userId) % 2 === 0
        ? TeamSide.Home
        : TeamSide.Away;
  const pooled = wire.country
    ? crowdCountries.find((country) => country.code === wire.country)
    : undefined;
  return {
    id: wire.id,
    author: wire.author,
    side,
    countryCode: wire.country ?? 'FAN',
    flag: pooled?.flag ?? '🌍',
    avatar: `https://i.pravatar.cc/64?img=${1 + (hashCode(wire.userId) % 70)}`,
    text: wire.text,
    ageLabel: 'now',
    source: CrowdSource.Community,
  };
}

/**
 * Streams REAL viewer messages (broadcast by the api crowd gateway) into the crowd
 * store, where they mingle with the simulated ambient pool. Own messages are skipped —
 * the send mutation already adds the optimistic self balloon.
 */
export function useCrowdFeed(): void {
  useEffect(() => {
    if (!backendEnabled) return;
    const socket = getSocket();

    const onMessage = (wire: CrowdMessageWire) => {
      if (!wire?.id || !wire.text) return;
      if (wire.userId === useAuthStore.getState().user?.id) return;
      useCrowdStore.getState().add(toCrowdMessage(wire));
    };

    socket.on(CrowdEvent.Message, onMessage);
    return () => {
      socket.off(CrowdEvent.Message, onMessage);
    };
  }, []);
}
