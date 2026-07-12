'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { friendService } from '@/services/friend.service';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { useFriendsStore } from '@/store/friends.store';
import { queryKeys } from './keys';

/**
 * BOOT hydration for the friend graph — pulls GET /friends when signed in and
 * mirrors the three id lists into the store. Realtime freshness comes from the
 * user channel (Friend notifications invalidate this query). Mount once.
 */
export function useFriends() {
  const isAuthed = useAuthStore((s) => s.status === 'authed');
  const hydrate = useFriendsStore((s) => s.hydrate);

  const query = useQuery({
    queryKey: queryKeys.friends(),
    queryFn: ({ signal }) => friendService.snapshot(signal),
    enabled: backendEnabled && isAuthed,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    hydrate(
      query.data.friends.map((u) => u.id),
      query.data.incoming.map((u) => u.id),
      query.data.outgoing.map((u) => u.id),
    );
  }, [query.isSuccess, query.data, hydrate]);

  return query;
}
