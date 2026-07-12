'use client';

import { useEffect } from 'react';

import { GlobalEvent } from '@/enums/global-event.enum';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { useRoomPicksStore, type RoomPickWire } from '@/store/room-picks.store';
import { getSocket } from './socket';

/**
 * Public global live feed — the landing/live hero counterpart of useRoomFeed.
 * Streams every OTHER bettor's real placed bet (`global:pick`, relayed by the gateway)
 * into the shared picks store, so the side-backers / pick-toast reflect real cross-user
 * activity, not a script. (The viewer count rides `global:presence` in useLiveFeed.)
 * Mock mode (USE_MOCK) skips this — useGlobalPicksDriver simulates a public book instead.
 */
export function useGlobalFeed(): void {
  useEffect(() => {
    if (!backendEnabled) return;
    const socket = getSocket();

    // Real picks relayed by the gateway (sender excluded server-side; self-guard kept for safety).
    const onPick = (payload: RoomPickWire) => {
      if (!payload?.id || !payload.label) return;
      if (payload.userId === useAuthStore.getState().user?.id) return;
      useRoomPicksStore.getState().addPick({
        id: payload.id,
        userId: payload.userId,
        name: payload.name,
        avatarSrc: payload.avatarSrc,
        isSelf: false,
        market: payload.market,
        selectionId: payload.selectionId,
        label: payload.label,
        odds: payload.odds,
        createdAt: Date.now(),
      });
    };

    socket.on(GlobalEvent.Pick, onPick);
    return () => {
      socket.off(GlobalEvent.Pick, onPick);
    };
  }, []);
}
