/**
 * Socket.io event names for invite-only rooms — mirror of the api RoomEvent.
 * Only these `room:*` events are room-scoped; the global match feed still reaches
 * every socket (see use-room-feed + use-live-feed running side by side).
 */
export enum RoomEvent {
  Join = 'room:join',
  Leave = 'room:leave',
  MemberJoined = 'room:member-joined',
  MemberLeft = 'room:member-left',
  ChatMessage = 'room:chat',
  Presence = 'room:presence',
  Pick = 'room:pick',
}

/** Room lifecycle — mirror of the api RoomStatus. */
export enum RoomStatus {
  Open = 'Open',
  Live = 'Live',
  Closed = 'Closed',
}

/** Room member role — mirror of the api RoomMemberRole. */
export enum RoomMemberRole {
  Host = 'Host',
  Member = 'Member',
}
