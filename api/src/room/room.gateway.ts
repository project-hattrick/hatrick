import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { RoomEvent, roomChannel } from './enums/room-event.enum';
import type { RoomMemberDto, RoomMessageDto } from './dto/room.dto';

/**
 * Socket.io fan-out for invite-only rooms. ONLY `room:*` events are room-scoped;
 * the global match feed (RealtimeGateway) still broadcasts to every socket, so a
 * socket that also joined a room keeps receiving live match events unchanged.
 *
 * Authority for membership writes lives in the guarded HTTP controller — this
 * gateway only relays chat/presence for low latency.
 */
@WebSocketGateway({ cors: { origin: true } })
export class RoomGateway {
  private readonly logger = new Logger(RoomGateway.name);

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(RoomEvent.Join)
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId?: string },
  ): void {
    const roomId = body?.roomId;
    if (!roomId) return;
    void client.join(roomChannel(roomId));
    this.emitPresence(roomId);
  }

  @SubscribeMessage(RoomEvent.Leave)
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId?: string },
  ): void {
    const roomId = body?.roomId;
    if (!roomId) return;
    void client.leave(roomChannel(roomId));
    this.emitPresence(roomId);
  }

  /**
   * Relay a member's bet pick to the rest of the room. Ephemeral social echo only (nothing is
   * settled from it — real money flows through the guarded bet endpoints), so WS relay is fine.
   */
  @SubscribeMessage(RoomEvent.Pick)
  handlePick(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId?: string } & Record<string, unknown>,
  ): void {
    const roomId = body?.roomId;
    if (!roomId || typeof roomId !== 'string') return;
    client.to(roomChannel(roomId)).emit(RoomEvent.Pick, body);
  }

  /** Relay a persisted chat message to everyone in the room. */
  broadcastChat(roomId: string, message: RoomMessageDto): void {
    this.server?.to(roomChannel(roomId)).emit(RoomEvent.ChatMessage, message);
  }

  /** Relay a newly joined member to everyone in the room. */
  broadcastMemberJoined(roomId: string, member: RoomMemberDto): void {
    this.server?.to(roomChannel(roomId)).emit(RoomEvent.MemberJoined, member);
    this.emitPresence(roomId);
  }

  /** Snapshot of live sockets currently watching the room. */
  private emitPresence(roomId: string): void {
    const count = this.server?.sockets.adapter.rooms.get(roomChannel(roomId))?.size ?? 0;
    this.server?.to(roomChannel(roomId)).emit(RoomEvent.Presence, { roomId, count });
  }
}
