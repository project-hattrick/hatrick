'use client';

import { useQuery } from '@tanstack/react-query';

import { roomService } from '@/services/room.service';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from './keys';

/** Reads a room (with members) by id. Disabled when logged out / mock mode. */
export function useRoom(id: string | null) {
  const authed = useAuthStore((s) => s.status === 'authed');
  return useQuery({
    queryKey: queryKeys.room(id ?? ''),
    queryFn: ({ signal }) => roomService.getById(id as string, signal),
    enabled: !!id && backendEnabled && authed,
    staleTime: 15_000,
  });
}
