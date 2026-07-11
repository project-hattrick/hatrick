'use client';

import { useSelfIdentity } from '@/hooks/use-self-identity';
import { personaFor } from '@/lib/persona-fallback';
import { useAuthStore } from '@/store/auth.store';
import type { RoomMemberDto } from '@/services/room.service';

export interface MemberIdentity {
  name: string;
  avatarSrc: string;
}

/**
 * Display identity for a room member. The backend falls back to a wallet-slice
 * name and a null avatar — for the signed-in user we override with their real
 * profile identity; others keep the server name + a stable persona portrait.
 */
export function useMemberIdentity(): (member: RoomMemberDto) => MemberIdentity {
  const selfId = useAuthStore((s) => s.user?.id);
  const self = useSelfIdentity();

  return (member) =>
    member.userId === selfId
      ? { name: self.displayName, avatarSrc: self.portraitSrc }
      : { name: member.displayName, avatarSrc: member.avatarUrl ?? personaFor(member.userId) };
}
