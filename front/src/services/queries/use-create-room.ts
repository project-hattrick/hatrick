'use client';

import { useMutation } from '@tanstack/react-query';

import { roomService, type CreateRoomPayload } from '@/services/room.service';
import { useLocalizedRouter } from '@/hooks/use-localized-path';
import { useRequireAuth } from './use-require-auth';

/** Creates a private room, then routes the host into it (/room/[id]). */
export function useCreateRoom() {
  const router = useLocalizedRouter();
  const requireAuth = useRequireAuth();

  return useMutation({
    mutationFn: (payload: CreateRoomPayload = {}) => {
      if (!requireAuth()) {
        return Promise.reject(new Error('Sign in to open a private room'));
      }
      return roomService.create(payload);
    },
    onSuccess: ({ room }) => {
      router.push(`/room/${room.id}`);
    },
  });
}
