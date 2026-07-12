/**
 * Socket.io event names for the crowd balloon stream. Broadcast to every socket
 * on purpose — crowd chatter is ambient, like the global match feed.
 */
export enum CrowdEvent {
  Message = 'crowd:message', // server → all: a fan message became a balloon
}
