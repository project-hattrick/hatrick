'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { roomService } from '@/services/room.service';
import { useRoomStore } from '@/store/room.store';
import { queryKeys } from './keys';

/** Joins a room via an invite token, then reconciles members into the store. */
export function useJoinRoom() {
  const queryClient = useQueryClient();
  const setRoom = useRoomStore((s) => s.setRoom);

  return useMutation({
    mutationFn: (inviteToken: string) => roomService.join(inviteToken),
    onSuccess: (room) => {
      setRoom(room.id, room.members);
      queryClient.invalidateQueries({ queryKey: queryKeys.roomMembers(room.id) });
    },
  });
}
