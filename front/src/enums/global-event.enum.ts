/**
 * Socket.io event names for the PUBLIC global live view — mirror of the api GlobalEvent.
 * Broadcast to every socket (no room scoping): the live viewer count and the public
 * stream of real bets placed across the app (see use-global-feed + use-global-picks-driver).
 */
export enum GlobalEvent {
  Presence = 'global:presence',
  Pick = 'global:pick',
}
