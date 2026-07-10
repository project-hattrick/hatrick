'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { roomService } from '@/services/room.service';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { useRoomStore } from '@/store/room.store';
import { queryKeys } from './keys';

/**
 * Loads room chat history and seeds it into the room store (the socket feed then
 * appends live messages). Disabled when logged out / mock mode.
 */
export function useRoomMessagesQuery(id: string | null) {
  const authed = useAuthStore((s) => s.status === 'authed');
  const seedMessages = useRoomStore((s) => s.seedMessages);

  const query = useQuery({
    queryKey: queryKeys.roomMessages(id ?? ''),
    queryFn: ({ signal }) => roomService.listMessages(id as string, signal),
    enabled: !!id && backendEnabled && authed,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (query.data) seedMessages(query.data);
  }, [query.data, seedMessages]);

  return query;
}
