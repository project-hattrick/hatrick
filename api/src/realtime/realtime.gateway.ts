import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { EventName } from '../events/enums/event-name.enum';
import type { MatchEndPayload, MatchEventPayload, MarketViewPayload, OddsEventPayload } from '../events/dto';
import { TournamentStateService } from '../txline/services/tournament-state.service';

/**
 * Re-broadcasts domain events to the frontend over WebSocket. Generic base.
 * `match-event.during` / `match-event.after` mirror the two-state contract.
 */
@WebSocketGateway({ cors: { origin: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly state: TournamentStateService) {}

  handleConnection(client: Socket): void {
    client.emit(EventName.TournamentStateSync, this.state.getSnapshot());
  }

  @OnEvent('score-update.*')
  onMatchEvent(payload: MatchEventPayload): void {
    this.server?.emit(`match-event.${payload.state}`, payload);
  }

  @OnEvent(EventName.OddsUpdate)
  onOdds(payload: OddsEventPayload): void {
    this.server?.emit(EventName.OddsUpdate, payload);
  }

  @OnEvent(EventName.MarketUpdate)
  onMarket(payload: MarketViewPayload): void {
    this.server?.emit(EventName.MarketUpdate, payload);
  }

  @OnEvent(EventName.MatchEndAfter)
  onMatchEnd(payload: MatchEndPayload): void {
    this.server?.emit(EventName.MatchEndAfter, payload);
  }
}
