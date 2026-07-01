import { Module } from '@nestjs/common';

import { ChainConfig } from './chain.config';
import { SolanaService } from './solana.service';
import { FaucetService } from './faucet.service';
import { FaucetController } from './faucet.controller';
import { MarketService } from './market.service';
import { KeeperService } from './keeper.service';
import { BetService } from './bet.service';
import { BetController } from './bet.controller';

/**
 * Solana integration: RPC connection + config/keypairs, the play-token faucet,
 * market lifecycle (initialize_market), the settlement keeper (`match-end.after`
 * → settle_market), and the bet-transaction builder. Boot-safe — nothing runs
 * until SOLANA_ENABLED=true.
 */
@Module({
  providers: [
    ChainConfig,
    SolanaService,
    FaucetService,
    MarketService,
    KeeperService,
    BetService,
  ],
  controllers: [FaucetController, BetController],
  exports: [ChainConfig, SolanaService, MarketService],
})
export class ChainModule {}
