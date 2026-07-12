/**
 * Socket.io event names for per-user channels. Mirrors the `room:*` contract:
 * ONLY `user:*` + `notification:*` events are user-scoped; the global match feed
 * (RealtimeGateway) still broadcasts to every socket.
 */
export enum UserEvent {
  Join = 'user:join', // client → server: subscribe this socket to user:{id}
  Leave = 'user:leave', // client → server: unsubscribe
  NotificationNew = 'notification:new', // server → user channel: a persisted notification
}

/** Socket.io room name for one user's private event channel. */
export const userChannel = (userId: string): string => `user:${userId}`;
