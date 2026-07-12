/** Socket.io event names for the per-user channel — mirror of the api UserEvent enum. */
export enum UserEvent {
  Join = 'user:join', // client → server: subscribe this socket to user:{id}
  Leave = 'user:leave', // client → server: unsubscribe
  NotificationNew = 'notification:new', // server → user channel: a persisted notification
}
