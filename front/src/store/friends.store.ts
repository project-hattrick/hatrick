import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { FriendStatus } from '@/enums/friend-status.enum';
import { seedFriendIds, seedIncomingIds } from '@/config/duelists.config';

interface FriendsStore {
  /** Confirmed friends. */
  friendIds: string[];
  /** Requests the signed-in user has sent (pending). */
  outgoingIds: string[];
  /** Requests other players sent to the signed-in user (pending). */
  incomingIds: string[];
  /** Send a friend request to a player. */
  sendRequest: (id: string) => void;
  /** Cancel a request the user sent. */
  cancelRequest: (id: string) => void;
  /** Accept an incoming request → become friends. */
  acceptRequest: (id: string) => void;
  /** Decline an incoming request. */
  declineRequest: (id: string) => void;
  /** Remove an existing friend. */
  removeFriend: (id: string) => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const without = (list: string[], id: string) => list.filter((x) => x !== id);

/** Friend graph — client-only mock (no backend this sprint), persisted so it survives reloads. */
export const useFriendsStore = create<FriendsStore>()(
  persist(
    (set) => ({
      friendIds: seedFriendIds,
      outgoingIds: [],
      incomingIds: seedIncomingIds,
      sendRequest: (id) =>
        set((s) => ({ outgoingIds: s.outgoingIds.includes(id) ? s.outgoingIds : [...s.outgoingIds, id] })),
      cancelRequest: (id) => set((s) => ({ outgoingIds: without(s.outgoingIds, id) })),
      acceptRequest: (id) =>
        set((s) => ({ incomingIds: without(s.incomingIds, id), friendIds: [...s.friendIds, id] })),
      declineRequest: (id) => set((s) => ({ incomingIds: without(s.incomingIds, id) })),
      removeFriend: (id) => set((s) => ({ friendIds: without(s.friendIds, id) })),
    }),
    {
      name: 'hat-trick-friends',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);

/** Derive the relationship of a player id from the current friend graph. */
export function friendStatusOf(
  id: string,
  state: Pick<FriendsStore, 'friendIds' | 'outgoingIds' | 'incomingIds'>,
): FriendStatus {
  if (state.friendIds.includes(id)) return FriendStatus.Friends;
  if (state.incomingIds.includes(id)) return FriendStatus.Incoming;
  if (state.outgoingIds.includes(id)) return FriendStatus.Outgoing;
  return FriendStatus.None;
}
