'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { NotificationType } from '@/enums/notification-type.enum';
import { UserEvent } from '@/enums/user-event.enum';
import { authService } from '@/services/auth.service';
import { toAppNotification, type ServerNotification } from '@/services/notification.service';
import { backendEnabled } from '@/services/session-mode';
import { queryKeys } from '@/services/queries/keys';
import { useAuthStore } from '@/store/auth.store';
import { useBetsStore } from '@/store/bets.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { useWalletStore } from '@/store/wallet.store';
import { getSocket } from './socket';

const CH_MATCH_END = 'match-end.after';

/** Grace period for the settlement backstop — lets the server finish its pass first. */
const SETTLEMENT_BACKSTOP_MS = 3_000;

/**
 * Subscribes this socket to the signed-in user's channel and streams notification
 * pushes into the bell store. A Bet notification is also the settlement signal:
 * it triggers a refetch of bets + wallet so the UI reconciles to the server ledger.
 * The `match-end.after` listener is a backstop for dropped pushes. Mount once.
 */
export function useUserChannel(): void {
  const userId = useAuthStore((s) => (s.status === 'authed' ? (s.user?.id ?? null) : null));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!backendEnabled || !userId) return;
    const socket = getSocket();
    let backstop: ReturnType<typeof setTimeout> | null = null;

    const refetchSettlement = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.betsSession() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.walletTransactions() });
      authService
        .me()
        .then((user) => useWalletStore.getState().hydrate(Number(user.balance)))
        .catch(() => {});
    };

    const join = () => socket.emit(UserEvent.Join, { userId });
    const onNotification = (payload: ServerNotification) => {
      useNotificationsStore.getState().pushServer(toAppNotification(payload));
      if (payload.type === NotificationType.Bet) refetchSettlement();
      if (payload.type === NotificationType.Friend) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.friends() });
      }
    };
    // Backstop: if a push is dropped, the global match-end broadcast still tells us
    // one of our open bets' fixtures finished — refetch after the server's pass.
    const onMatchEnd = (payload: { fixtureId?: number }) => {
      const fixtureId = payload?.fixtureId;
      if (typeof fixtureId !== 'number') return;
      const hasOpenBet = useBetsStore.getState().open.some((bet) => bet.fixtureId === fixtureId);
      if (!hasOpenBet) return;
      if (backstop) clearTimeout(backstop);
      backstop = setTimeout(refetchSettlement, SETTLEMENT_BACKSTOP_MS);
    };

    join();
    // socket.io reconnects silently drop channel membership — re-join every connect.
    socket.on('connect', join);
    socket.on(UserEvent.NotificationNew, onNotification);
    socket.on(CH_MATCH_END, onMatchEnd);

    return () => {
      if (backstop) clearTimeout(backstop);
      socket.emit(UserEvent.Leave, { userId });
      socket.off('connect', join);
      socket.off(UserEvent.NotificationNew, onNotification);
      socket.off(CH_MATCH_END, onMatchEnd);
    };
  }, [userId, queryClient]);
}
