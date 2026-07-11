/**
 * Socket.io event names for invite-only rooms. Room isolation scopes ONLY these
 * `room:*` events — the global match feed (`match-event.*`, `odds.update`,
 * `match-end.after`) is broadcast to every socket and still reaches room members.
 */
export enum RoomEvent {
  Join = 'room:join', // client → server: subscribe this socket to room:{id}
  Leave = 'room:leave', // client → server: unsubscribe
  MemberJoined = 'room:member-joined', // server → room: a new member joined
  MemberLeft = 'room:member-left', // server → room: a member left
  ChatMessage = 'room:chat', // server → room: persisted chat message echo
  Presence = 'room:presence', // server → room: live socket count snapshot
  Pick = 'room:pick', // client → server → room: a member's bet pick (ephemeral social echo)
}

/** Socket.io room channel for a given room id. */
export const roomChannel = (roomId: string): string => `room:${roomId}`;
