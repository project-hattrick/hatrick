/**
 * Socket.io event names for per-user channels. Mirrors the `room:*` contract:
 * ONLY `user:*` + `notification:*` events are user-scoped; the global match feed
 * (RealtimeGateway) still broadcasts to every socket.
 */
export enum UserEvent {
  Join = 'user:join', // client → server: subscribe this socket to user:{id}
  Leave = 'user:leave', // client → server: unsubscribe
  NotificationNew = 'notification:new', // server → user channel: a persisted notification
  /** Server → opponent when a real 1v1 challenge is issued. */
  DuelInvite = 'duel:invite',
  /** Server → both players when both lineups are locked and the duel goes Live. */
  DuelReady = 'duel:ready',
  /** Server → both players when the duel has been settled. */
  DuelSettled = 'duel:settled',
}

/** Socket.io room name for one user's private event channel. */
export const userChannel = (userId: string): string => `user:${userId}`;
