'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fantasyService } from '@/services/fantasy.service';
import { useAuthStore } from '@/store/auth.store';
import { useFantasyStore } from '@/store/fantasy.store';
import { queryKeys } from './keys';

const DEFAULT_FORMATION = '4-3-3';

/**
 * BOOT hydration for the fantasy domain — fetches the collection + active XI when
 * signed in and mirrors them into the fantasy store, so progress follows the account
 * across devices. Mount once (in WalletAuthSync). Guests keep their local state.
 */
export function useFantasySession() {
  const isAuthed = useAuthStore((s) => s.status === 'authed');
  const hydrate = useFantasyStore((s) => s.hydrate);

  const query = useQuery({
    queryKey: queryKeys.fantasySession(),
    queryFn: async ({ signal }) => {
      const [collection, squad] = await Promise.all([
        fantasyService.collection(signal),
        fantasyService.getSquad(signal),
      ]);
      return { collection, squad };
    },
    enabled: isAuthed,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    const { collection: raw, squad } = query.data;
    // The server holds a multiset of owned copies; the front models a set keyed by
    // name — dedupe to one card per name (keeping its owned copy id).
    const seen = new Set<string>();
    const collection = raw.filter((c) => (seen.has(c.name) ? false : (seen.add(c.name), true)));

    let order: number[] = [];
    let formation = DEFAULT_FORMATION;
    if (squad) {
      formation = squad.formation;
      const indexByName = new Map(collection.map((c, i) => [c.name, i]));
      order = squad.slots
        .map((slot) => indexByName.get(slot.card.name))
        .filter((i): i is number => i !== undefined);
    }
    hydrate({ collection, squad: order, formation });
  }, [query.isSuccess, query.data, hydrate]);

  return query;
}
