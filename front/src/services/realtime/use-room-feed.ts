'use client';

import { useEffect } from 'react';

import { RoomEvent } from '@/enums/room-event.enum';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { useRoomStore } from '@/store/room.store';
import { useRoomPicksStore, type RoomPickWire } from '@/store/room-picks.store';
import type { RoomMemberDto, RoomMessageDto } from '@/services/room.service';
import { getSocket } from './socket';

/**
 * Subscribes this socket to a room channel and streams chat/member/presence
 * events into the room store. Runs ALONGSIDE useLiveFeed — the global match feed
 * is broadcast to every socket, so the room still mirrors the current live game.
 */
export function useRoomFeed(roomId: string | null): void {
  const addMessage = useRoomStore((s) => s.addMessage);
  const addMember = useRoomStore((s) => s.addMember);
  const setPresence = useRoomStore((s) => s.setPresence);

  useEffect(() => {
    if (!roomId || !backendEnabled) return;
    const socket = getSocket();

    const onChat = (message: RoomMessageDto) => addMessage(message);
    const onMember = (member: RoomMemberDto) => addMember(member);
    const onPresence = (payload: { roomId: string; count: number }) => {
      if (payload.roomId === roomId) setPresence(payload.count);
    };
    // Real member picks (ephemeral social echo relayed by the gateway; sender excluded server-side).
    const onPick = (payload: RoomPickWire) => {
      if (payload?.roomId !== roomId || !payload.id || !payload.label) return;
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

    socket.emit(RoomEvent.Join, { roomId });
    socket.on(RoomEvent.ChatMessage, onChat);
    socket.on(RoomEvent.MemberJoined, onMember);
    socket.on(RoomEvent.Presence, onPresence);
    socket.on(RoomEvent.Pick, onPick);

    return () => {
      socket.emit(RoomEvent.Leave, { roomId });
      socket.off(RoomEvent.ChatMessage, onChat);
      socket.off(RoomEvent.MemberJoined, onMember);
      socket.off(RoomEvent.Presence, onPresence);
      socket.off(RoomEvent.Pick, onPick);
    };
  }, [roomId, addMessage, addMember, setPresence]);
}
