'use client';

import { RoomMemberRole } from '@/enums/room-event.enum';
import { useAuthStore } from '@/store/auth.store';
import { useRoomMembers } from '@/store/room.store';

export function useIsRoomHost(): boolean {
  const selfId = useAuthStore((state) => state.user?.id);
  const members = useRoomMembers();

  return Boolean(
    selfId &&
      members.some((member) => member.userId === selfId && member.role === RoomMemberRole.Host),
  );
}
