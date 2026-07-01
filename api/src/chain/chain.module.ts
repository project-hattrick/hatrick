import { Module } from '@nestjs/common';

import { ChainConfig } from './chain.config';
import { SolanaService } from './solana.service';
import { FaucetService } from './faucet.service';
import { FaucetController } from './faucet.controller';

/**
 * Solana integration seam: RPC connection, config/keypairs, and the play-token
 * faucet. The keeper (settle_market on `match-end.after`) lands here next.
 * Boot-safe — does nothing until SOLANA_ENABLED=true.
 */
@Module({
  providers: [ChainConfig, SolanaService, FaucetService],
  controllers: [FaucetController],
  exports: [ChainConfig, SolanaService],
})
export class ChainModule {}
