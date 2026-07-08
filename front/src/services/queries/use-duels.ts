'use client';

import { useQuery } from '@tanstack/react-query';
import { duelService } from '@/services/fantasy.service';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from './keys';

/** The signed-in player's real duel history (disabled in mock/logged-out). */
export function useDuels() {
  const authed = useAuthStore((s) => s.status === 'authed');
  return useQuery({
    queryKey: queryKeys.duels(),
    queryFn: ({ signal }) => duelService.list(signal),
    enabled: backendEnabled && authed,
    staleTime: 30_000,
  });
}
