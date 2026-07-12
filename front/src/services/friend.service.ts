import { endpoints } from './endpoints';
import { api } from './http';
import type { ApiUserDto } from '@/lib/user-mapper';

/** GET /friends — each list holds the OTHER party's profile. */
export interface FriendsSnapshot {
  friends: ApiUserDto[];
  incoming: ApiUserDto[];
  outgoing: ApiUserDto[];
}

/** Server-backed friend graph — routes keyed by the counterpart's userId. */
export const friendService = {
  snapshot: (signal?: AbortSignal): Promise<FriendsSnapshot> =>
    api.get<FriendsSnapshot>(endpoints.friends.base, signal),

  sendRequest: (userId: string): Promise<void> =>
    api.post<void>(endpoints.friends.requests, { userId }),

  respond: (userId: string, accept: boolean): Promise<void> =>
    api.post<void>(endpoints.friends.respond, { userId, accept }),

  remove: (userId: string): Promise<void> => api.del<void>(endpoints.friends.byUser(userId)),
};
