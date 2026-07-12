/** Socket.io event names for the crowd balloon stream — mirror of the api CrowdEvent enum. */
export enum CrowdEvent {
  Message = 'crowd:message', // server → all: a fan message became a balloon
}
