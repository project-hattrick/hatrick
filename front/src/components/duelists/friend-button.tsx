'use client';

import type { ReactNode } from 'react';
import { useFriendsStore, friendStatusOf } from '@/store/friends.store';
import { FriendStatus } from '@/enums/friend-status.enum';
import { Button } from '@/components/ui/button';
import { UserPlus, Clock, Check, Users, X } from '@/components/common/icons';

interface FriendButtonProps {
  id: string;
}

/**
 * Renders the appropriate friend-relationship action for a given player id.
 * Branch is a Record<FriendStatus, ReactNode> lookup — no switch/case.
 */
export function FriendButton({ id }: FriendButtonProps) {
  const friendIds = useFriendsStore((s) => s.friendIds);
  const outgoingIds = useFriendsStore((s) => s.outgoingIds);
  const incomingIds = useFriendsStore((s) => s.incomingIds);
  const sendRequest = useFriendsStore((s) => s.sendRequest);
  const cancelRequest = useFriendsStore((s) => s.cancelRequest);
  const acceptRequest = useFriendsStore((s) => s.acceptRequest);
  const declineRequest = useFriendsStore((s) => s.declineRequest);
  const removeFriend = useFriendsStore((s) => s.removeFriend);

  const status = friendStatusOf(id, { friendIds, outgoingIds, incomingIds });

  const statusNode: Record<FriendStatus, ReactNode> = {
    [FriendStatus.None]: (
      <Button size="sm" variant="outline" onClick={() => sendRequest(id)}>
        <UserPlus /> Add friend
      </Button>
    ),
    [FriendStatus.Outgoing]: (
      <Button size="sm" variant="outline" onClick={() => cancelRequest(id)}>
        <Clock /> Requested
      </Button>
    ),
    [FriendStatus.Incoming]: (
      <span className="flex items-center gap-1.5">
        <Button size="sm" onClick={() => acceptRequest(id)}>
          <Check /> Accept
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Decline friend request"
          onClick={() => declineRequest(id)}
        >
          <X />
        </Button>
      </span>
    ),
    [FriendStatus.Friends]: (
      <Button size="sm" variant="secondary" onClick={() => removeFriend(id)}>
        <Users /> Friends
      </Button>
    ),
  };

  return <>{statusNode[status]}</>;
}
