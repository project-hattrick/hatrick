'use client';

import { useMutation } from '@tanstack/react-query';

import { roomService } from '@/services/room.service';
import { useRoomStore } from '@/store/room.store';

/**
 * Posts a chat message. The server echoes it back over the room socket, so we let
 * the feed add it (dedup by id in the store) rather than optimistically inserting.
 */
export function usePostRoomMessage(roomId: string) {
  const addMessage = useRoomStore((s) => s.addMessage);

  return useMutation({
    mutationFn: (body: string) => roomService.postMessage(roomId, body),
    onSuccess: (message) => {
      // Instant echo for the sender in case the socket round-trip lags.
      addMessage(message);
    },
  });
}
