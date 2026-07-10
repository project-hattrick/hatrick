'use client';

import { useQuery } from '@tanstack/react-query';

import { roomService } from '@/services/room.service';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from './keys';

/** Room members (join order). Disabled when logged out / mock mode. */
export function useRoomMembersQuery(id: string | null) {
  const authed = useAuthStore((s) => s.status === 'authed');
  return useQuery({
    queryKey: queryKeys.roomMembers(id ?? ''),
    queryFn: ({ signal }) => roomService.listMembers(id as string, signal),
    enabled: !!id && backendEnabled && authed,
    staleTime: 15_000,
  });
}
