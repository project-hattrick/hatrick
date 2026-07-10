'use client';

import { useEffect } from 'react';

import { RoomEvent } from '@/enums/room-event.enum';
import { backendEnabled } from '@/services/session-mode';
import { useRoomStore } from '@/store/room.store';
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

    socket.emit(RoomEvent.Join, { roomId });
    socket.on(RoomEvent.ChatMessage, onChat);
    socket.on(RoomEvent.MemberJoined, onMember);
    socket.on(RoomEvent.Presence, onPresence);

    return () => {
      socket.emit(RoomEvent.Leave, { roomId });
      socket.off(RoomEvent.ChatMessage, onChat);
      socket.off(RoomEvent.MemberJoined, onMember);
      socket.off(RoomEvent.Presence, onPresence);
    };
  }, [roomId, addMessage, addMember, setPresence]);
}
