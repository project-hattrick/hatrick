'use client';

import { useQuery } from '@tanstack/react-query';
import { duelService, type DuelDetailDto } from '@/services/fantasy.service';
import { queryKeys } from './keys';

/**
 * Fetches a single duel by its server id.
 * Used by the host waiting screen and the guest join page.
 */
export function useDuelDetail(id: string | null) {
  return useQuery<DuelDetailDto>({
    queryKey: queryKeys.duelDetail(id ?? ''),
    queryFn: ({ signal }) => duelService.get(id!, signal),
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}
