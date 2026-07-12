import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';

import { CrowdEvent } from './enums/crowd-event.enum';
import type { CrowdMessageBroadcastDto } from './dto/crowd-message.dto';

/** Fan-out for crowd balloons — global broadcast, same posture as the match feed. */
@WebSocketGateway({ cors: { origin: true } })
export class CrowdGateway {
  @WebSocketServer()
  server!: Server;

  broadcastMessage(payload: CrowdMessageBroadcastDto): void {
    this.server?.emit(CrowdEvent.Message, payload);
  }
}
