import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { UserEvent, userChannel } from './enums/user-event.enum';
import type { NotificationDto } from './dto/notification.dto';

/**
 * Socket.io fan-out for per-user channels (notification pushes). Same trust
 * model as RoomGateway: the client declares which channel to join — payloads
 * stay non-sensitive (titles + hrefs) and all reads/writes go through the
 * guarded HTTP endpoints. No WS cookie auth this sprint.
 */
@WebSocketGateway({ cors: { origin: true } })
export class UserGateway {
  private readonly logger = new Logger(UserGateway.name);

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(UserEvent.Join)
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId?: string },
  ): void {
    const userId = body?.userId;
    if (!userId) return;
    void client.join(userChannel(userId));
  }

  @SubscribeMessage(UserEvent.Leave)
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId?: string },
  ): void {
    const userId = body?.userId;
    if (!userId) return;
    void client.leave(userChannel(userId));
  }

  /** Push a freshly persisted notification to every socket the user has open. */
  emitNotification(userId: string, notification: NotificationDto): void {
    this.server?.to(userChannel(userId)).emit(UserEvent.NotificationNew, notification);
  }
}
