import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EventName } from '../events/enums/event-name.enum';
import { MarketType } from '../events/enums/market-type.enum';
import { MatchResultOutcome } from '../events/enums/match-result-outcome.enum';
import type { MatchEndPayload } from '../events/dto';
import { ChainConfig } from './chain.config';
import { SolanaService } from './solana.service';
import { HatTrickClient, MarketStatus, selectionHash } from './hat-trick.client';

/**
 * Settlement keeper — listens for the authoritative `match-end.after` and
 * settles the fixture's MatchResult market on-chain by submitting an
 * oracle-signed result. Permissionless on-chain; the oracle signature is the
 * gate (see contracts settle_market). Best-effort: logs and skips on any issue.
 */
@Injectable()
export class KeeperService {
  private readonly logger = new Logger(KeeperService.name);

  constructor(
    private readonly solana: SolanaService,
    private readonly cfg: ChainConfig,
  ) {}

  @OnEvent(EventName.MatchEndAfter)
  async onMatchEnd(payload: MatchEndPayload): Promise<void> {
    if (!this.cfg.enabled) return;
    if (!payload.outcome) {
      this.logger.warn(`fixture ${payload.fixtureId} ended with no parseable outcome — not settling`);
      return;
    }
    try {
      await this.settleMatchResult(payload.fixtureId, payload.outcome);
    } catch (err) {
      this.logger.error(`settle failed for fixture ${payload.fixtureId}: ${String(err)}`);
    }
  }

  /** Settle the fixture's MatchResult market to `outcome`; returns the tx sig or null. */
  async settleMatchResult(fixtureId: number, outcome: MatchResultOutcome): Promise<string | null> {
    const marketId = HatTrickClient.deriveMarketId(fixtureId, MarketType.MatchResult);
    const market = await this.solana.getMarket(marketId);
    if (!market) {
      this.logger.warn(`no market for fixture ${fixtureId} — nothing to settle`);
      return null;
    }
    if (market.status !== MarketStatus.Open) {
      this.logger.log(`market for fixture ${fixtureId} already ${MarketStatus[market.status]}`);
      return null;
    }

    const oracle = this.cfg.oracle();
    const ixs = this.solana.client.buildSettle({
      settler: oracle.publicKey,
      oracle,
      marketId,
      selection: selectionHash(outcome),
      closeTs: market.closeTs,
    });

    const sig = await this.solana.send(ixs, [oracle]);
    this.logger.log(`settled fixture ${fixtureId} → ${outcome} (${sig})`);
    return sig;
  }
}
