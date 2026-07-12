import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { EventName } from '../events/enums/event-name.enum';
import type { MatchEndPayload, MatchEventPayload, MarketViewPayload, OddsEventPayload } from '../events/dto';
import { TournamentStateService } from '../txline/services/tournament-state.service';
import { GlobalEvent } from './global-event.enum';

/**
 * Re-broadcasts domain events to the frontend over WebSocket. Generic base.
 * `match-event.during` / `match-event.after` mirror the two-state contract.
 * Also owns the PUBLIC global layer: live viewer count + a relay of real picks.
 */
@WebSocketGateway({ cors: { origin: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly state: TournamentStateService) {}

  handleConnection(client: Socket): void {
    client.emit(EventName.TournamentStateSync, this.state.getSnapshot());
    this.emitViewers();
  }

  handleDisconnect(): void {
    this.emitViewers();
  }

  /**
   * Relay a bettor's freshly placed real bet to every OTHER socket as a public
   * global pick — the global counterpart of `RoomEvent.Pick`. Ephemeral social echo
   * only (nothing settles from it; real stakes flow through the guarded /bets endpoint).
   */
  @SubscribeMessage(GlobalEvent.Pick)
  handleGlobalPick(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: Record<string, unknown>,
  ): void {
    if (!body || typeof body.id !== 'string' || typeof body.label !== 'string') return;
    client.broadcast.emit(GlobalEvent.Pick, body);
  }

  /** Broadcast the live viewer count (connected sockets) to everyone. */
  private emitViewers(): void {
    const count = this.server?.sockets?.sockets?.size ?? 0;
    this.server?.emit(GlobalEvent.Presence, { count });
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
