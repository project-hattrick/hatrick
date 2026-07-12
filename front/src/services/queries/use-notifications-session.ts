'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { notificationService, toAppNotification } from '@/services/notification.service';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { queryKeys } from './keys';

/**
 * BOOT hydration for the bell feed — pulls the server notifications when signed in
 * and mirrors them into the store wholesale (server is the source of truth).
 * Realtime pushes arrive separately via useUserChannel. Mount once.
 */
export function useNotificationsSession() {
  const isAuthed = useAuthStore((s) => s.status === 'authed');
  const hydrate = useNotificationsStore((s) => s.hydrate);

  const query = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: ({ signal }) => notificationService.list(signal),
    enabled: backendEnabled && isAuthed,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    hydrate(query.data.map(toAppNotification));
  }, [query.isSuccess, query.data, hydrate]);

  return query;
}
