import { Injectable, Logger } from '@nestjs/common';

import { MarketType } from '../../events/enums/market-type.enum';
import { ChainConfig } from '../chain.config';
import { SolanaService } from './solana.service';
import { HatTrickClient } from '../hat-trick.client';

/**
 * Opens on-chain markets for real fixtures (Live Mode). A market is pre-match:
 * betting closes at `closeTs` (kickoff) and the keeper settles it after full
 * time. Server-signed by the configured authority; the play-token mint must be
 * set (PLAY_TOKEN_MINT).
 */
@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(
    private readonly solana: SolanaService,
    private readonly cfg: ChainConfig,
  ) {}

  async openMarket(fixtureId: number, market: MarketType, closeTs: number): Promise<string> {
    this.solana.ensureEnabled();
    const mint = this.cfg.playTokenMint();
    if (!mint) throw new Error('PLAY_TOKEN_MINT must be set to open markets');

    const authority = this.cfg.mintAuthority();
    const marketId = HatTrickClient.deriveMarketId(fixtureId, market);
    const ix = this.solana.client.buildInitializeMarket({
      authority: authority.publicKey,
      mint,
      marketId,
      oracle: this.cfg.oracle().publicKey,
      closeTs,
      voidDelay: this.cfg.voidDelaySeconds,
    });

    const sig = await this.solana.send([ix], [authority]);
    this.logger.log(`opened market fixture=${fixtureId} ${market} (${sig})`);
    return sig;
  }
}
