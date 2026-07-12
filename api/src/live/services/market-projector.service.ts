import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { EventName } from '../../events/enums/event-name.enum';
import type { MarketViewPayload, OddsEventPayload, MatchEndPayload } from '../../events/dto';
import { projectOdds } from './odds-projection.util';

/** Stable key for a market inside a fixture's book (market family + line). */
function marketKey(view: MarketViewPayload): string {
  return view.line == null ? view.market : `${view.market}:${view.line}`;
}

/**
 * Projects raw TxLINE odds updates into normalized, tradeable `MarketType` views and keeps a live
 * book per fixture. Emits `market.update` (the gateway forwards it) and answers snapshot reads via
 * `getFixtureMarkets`, so the betting surface is data-driven instead of assembled from raw wire.
 */
@Injectable()
export class MarketProjectorService {
  private readonly logger = new Logger(MarketProjectorService.name);

  /** fixtureId → (marketKey → latest view). Pruned when the fixture ends. */
  private readonly book = new Map<number, Map<string, MarketViewPayload>>();

  constructor(private readonly emitter: EventEmitter2) {}

  @OnEvent(EventName.OddsUpdate)
  onOdds(payload: OddsEventPayload): void {
    const view = projectOdds(payload);
    if (!view) return;

    let fixtureBook = this.book.get(view.fixtureId);
    if (!fixtureBook) {
      fixtureBook = new Map();
      this.book.set(view.fixtureId, fixtureBook);
    }
    fixtureBook.set(marketKey(view), view);

    this.emitter.emit(EventName.MarketUpdate, view);
    this.logger.debug(
      `market ${view.market}${view.line != null ? ` @${view.line}` : ''} — fixture ${view.fixtureId}, ${view.selections.length} selections`,
    );
  }

  @OnEvent(EventName.MatchEndAfter)
  onMatchEnd(payload: MatchEndPayload): void {
    this.book.delete(payload.fixtureId);
  }

  /** Snapshot of the projected markets currently open on a fixture (empty when none priced yet). */
  getFixtureMarkets(fixtureId: number): MarketViewPayload[] {
    return [...(this.book.get(fixtureId)?.values() ?? [])];
  }
}
