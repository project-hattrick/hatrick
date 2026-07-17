'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { useDuelInviteStore, type IncomingDuelInvite } from '@/store/duel-invite.store';
import { useDuelStore } from '@/store/duel.store';
import { usePendingNavStore } from '@/store/pending-nav.store';
import type { DuelResultValue } from '@/services/fantasy.service';
import { duelService } from '@/services/fantasy.service';
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

    // --- PvP duel events ---
    const onDuelInvite = (payload: IncomingDuelInvite) => {
      useDuelInviteStore.getState().setInvite(payload);
      toast.info('New duel challenge', {
        description: `${payload.hostName} challenged you to a 1v1 duel.`,
      });
    };

    const onDuelReady = (payload: { duelId: string }) => {
      const duelId = payload?.duelId;
      if (!duelId) return;
      // Determine role: if the current user is already the host (they created the duel
      // and are waiting), they're 'host'; if they just joined, they're 'guest'.
      // We resolve by fetching the duel detail and checking host.id vs current userId.
      void duelService.get(duelId).then((detail) => {
        const role = detail.host.id === userId ? 'host' : 'guest';
        useDuelStore.getState().startServerDuel(detail, role);
        usePendingNavStore.getState().navigate(`/duel/${duelId}`);
      }).catch(() => {
        // Fallback: navigate anyway and let the page recover.
        usePendingNavStore.getState().navigate(`/duel/${duelId}`);
      });
    };

    const onDuelSettled = (payload: { duelId: string; hostScore: number; guestScore: number; guestResult: DuelResultValue }) => {
      const { duelId, hostScore, guestScore, guestResult } = payload ?? {};
      if (!duelId) return;
      const store = useDuelStore.getState();
      // Only apply if this is our active duel and we are the guest.
      if (store.serverId === duelId && store.role === 'guest') {
        store.receiveSettlement(hostScore, guestScore, guestResult);
      }
    };

    join();
    // socket.io reconnects silently drop channel membership — re-join every connect.
    socket.on('connect', join);
    socket.on(UserEvent.NotificationNew, onNotification);
    socket.on(CH_MATCH_END, onMatchEnd);
    socket.on(UserEvent.DuelInvite, onDuelInvite);
    socket.on(UserEvent.DuelReady, onDuelReady);
    socket.on(UserEvent.DuelSettled, onDuelSettled);

    return () => {
      if (backstop) clearTimeout(backstop);
      socket.emit(UserEvent.Leave, { userId });
      socket.off('connect', join);
      socket.off(UserEvent.NotificationNew, onNotification);
      socket.off(CH_MATCH_END, onMatchEnd);
      socket.off(UserEvent.DuelInvite, onDuelInvite);
      socket.off(UserEvent.DuelReady, onDuelReady);
      socket.off(UserEvent.DuelSettled, onDuelSettled);
    };
  }, [userId, queryClient]);
}
