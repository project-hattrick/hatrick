import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { FriendStatus } from '@/enums/friend-status.enum';
import { env } from '@/lib/env';
import { seedFriendIds, seedIncomingIds } from '@/config/duelists.config';
import { friendService } from '@/services/friend.service';
import { isBackendSession } from '@/services/session-mode';

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
  /** Wholesale replace from the server snapshot (boot hydration). */
  hydrate: (friendIds: string[], incomingIds: string[], outgoingIds: string[]) => void;
  /** Clear the graph on sign-out. */
  reset: () => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const without = (list: string[], id: string) => list.filter((x) => x !== id);

/** Swallow errors on server mirrors — local state already reflects the intent. */
const mirror = (call: () => Promise<void>): void => {
  if (isBackendSession()) call().catch(() => {});
};

/**
 * Friend graph. Mock mode: seeded from the duelists config and persisted locally.
 * Backend mode: hydrated from GET /friends (real user cuids) and every action is
 * mirrored to the guarded endpoints — nothing persists locally, the server owns it.
 */
export const useFriendsStore = create<FriendsStore>()(
  persist(
    (set) => ({
      friendIds: env.useMock ? seedFriendIds : [],
      outgoingIds: [],
      incomingIds: env.useMock ? seedIncomingIds : [],
      sendRequest: (id) => {
        set((s) => ({ outgoingIds: s.outgoingIds.includes(id) ? s.outgoingIds : [...s.outgoingIds, id] }));
        mirror(() => friendService.sendRequest(id));
      },
      cancelRequest: (id) => {
        set((s) => ({ outgoingIds: without(s.outgoingIds, id) }));
        mirror(() => friendService.remove(id));
      },
      acceptRequest: (id) => {
        set((s) => ({ incomingIds: without(s.incomingIds, id), friendIds: [...s.friendIds, id] }));
        mirror(() => friendService.respond(id, true));
      },
      declineRequest: (id) => {
        set((s) => ({ incomingIds: without(s.incomingIds, id) }));
        mirror(() => friendService.respond(id, false));
      },
      removeFriend: (id) => {
        set((s) => ({ friendIds: without(s.friendIds, id) }));
        mirror(() => friendService.remove(id));
      },
      hydrate: (friendIds, incomingIds, outgoingIds) =>
        set({ friendIds, incomingIds, outgoingIds }),
      reset: () => set({ friendIds: [], incomingIds: [], outgoingIds: [] }),
    }),
    {
      name: 'hat-trick-friends',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
      // Backend mode: the server owns the graph — persist nothing, so mock 'd*' seed
      // ids can never leak into a real session (the id namespaces are disjoint).
      partialize: (state) =>
        env.useMock
          ? {
              friendIds: state.friendIds,
              outgoingIds: state.outgoingIds,
              incomingIds: state.incomingIds,
            }
          : ({} as Partial<FriendsStore>),
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
