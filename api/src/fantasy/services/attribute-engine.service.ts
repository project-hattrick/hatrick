import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';

import { EventName } from '../../events/enums';
import type { MatchEndPayload, MatchEventPayload } from '../../events/dto';
import type { PlayerMatchStats, PlayerStatsBySide } from '../../txline/txline.types';
import { CardRepository } from '../repositories';
import { applyFormDelta, computeFormDelta, isMeaningful, type CardStats } from './form-delta.util';

/**
 * Fantasy attribute engine. Accumulates the authoritative per-player TxLINE stats streamed on
 * `*.after`, then on `match-end.after` folds them into the cards mapped to those players
 * (`CardCatalog.realPlayerId`). Each round writes one immutable `CardAttributeSnapshot` (audit
 * trail) and updates the catalog rating/stats so the collection, market and duels reflect live
 * form immediately. Idempotent per fixture via the snapshot's unique (cardId, roundKey).
 */
@Injectable()
export class AttributeEngineService {
  private readonly logger = new Logger(AttributeEngineService.name);

  /** fixtureId → latest cumulative per-player stats (the wire resends totals, so latest wins). */
  private readonly accum = new Map<number, PlayerStatsBySide>();

  constructor(private readonly cards: CardRepository) {}

  @OnEvent('*.after')
  onConfirmed(payload: MatchEventPayload): void {
    if (!payload.playerStats) return;
    this.accum.set(payload.fixtureId, payload.playerStats);
  }

  @OnEvent(EventName.MatchEndAfter)
  async onMatchEnd(payload: MatchEndPayload): Promise<void> {
    const stats = this.accum.get(payload.fixtureId);
    this.accum.delete(payload.fixtureId);
    if (!stats) return;

    const roundKey = `fx:${payload.fixtureId}`;
    const byPlayer = { ...stats.home, ...stats.away };
    let evolved = 0;

    for (const [playerIdRaw, playerStats] of Object.entries(byPlayer)) {
      const playerId = Number(playerIdRaw);
      if (!Number.isFinite(playerId)) continue;
      const delta = computeFormDelta(playerStats as PlayerMatchStats);
      if (!isMeaningful(delta)) continue;

      const catalogCards = await this.cards.findByRealPlayerId(playerId);
      for (const card of catalogCards) {
        const existing = await this.cards.findSnapshot(card.id, roundKey);
        if (existing) continue; // already applied this fixture — keep replays idempotent

        const base = (card.stats ?? {}) as CardStats;
        const next = applyFormDelta(base, card.rating, delta);
        await this.cards.addSnapshot({
          card: { connect: { id: card.id } },
          roundKey,
          rating: next.rating,
          stats: next.stats as unknown as Prisma.InputJsonValue,
        });
        await this.cards.updateStats(card.id, next.stats as unknown as Prisma.InputJsonValue, next.rating);
        evolved += 1;
      }
    }

    if (evolved) this.logger.log(`fixture ${payload.fixtureId}: evolved ${evolved} card(s) from live form`);
  }
}
