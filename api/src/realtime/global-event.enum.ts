/**
 * Socket.io event names for the PUBLIC global live view. Unlike `room:*` these are
 * NOT room-scoped — they broadcast to every connected socket:
 *  - `Presence`: the live viewer count (connected sockets), pushed on every connect/disconnect.
 *  - `Pick`: a bettor's freshly placed real bet, relayed to all OTHER sockets as an
 *    ephemeral social echo (nothing settles from it — real stakes flow through /bets).
 */
export enum GlobalEvent {
  Presence = 'global:presence', // server → all: live viewer (connected socket) count
  Pick = 'global:pick', // client → server → all others: a real placed bet (ephemeral echo)
}
