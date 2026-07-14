import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { FantasyModule } from '../fantasy/fantasy.module';

import { ChainConfig } from './chain.config';
import { SolanaService } from './services/solana.service';
import { FaucetService } from './services/faucet.service';
import { FaucetController } from './faucet.controller';
import { MarketService } from './services/market.service';
import { KeeperService } from './services/keeper.service';
import { BetService } from './services/bet.service';
import { BetController } from './bet.controller';

import { SeedCommitRepository } from './repositories/seed-commit.repository';
import { ProvablyFairService } from './services/provably-fair.service';
import { DuelChainService } from './services/duel-chain.service';
import { PackChainService } from './services/pack-chain.service';
import { ChainController } from './chain.controller';

/**
 * Solana integration: RPC connection + config/keypairs, the play-token faucet,
 * market lifecycle, settlement keeper, bet-tx builder, provably-fair commit/reveal,
 * fantasy duel on-chain, and pack cNFT minting.
 *
 * Boot-safe — nothing runs until SOLANA_ENABLED=true.
 * Chain features are gated; off-chain play-money paths remain unaffected.
 */
@Module({
  imports: [
    AuthModule,    // JwtAuthGuard for guarded controllers
    UsersModule,   // UserRepository + WalletRepository for chain mirrors
    FantasyModule, // OwnedCardRepository + CardRepository for pack mirrors
    // PrismaModule is @Global() — PrismaService injected without explicit import
  ],
  providers: [
    ChainConfig,
    SolanaService,
    FaucetService,
    MarketService,
    KeeperService,
    BetService,
    SeedCommitRepository,
    ProvablyFairService,
    DuelChainService,
    PackChainService,
  ],
  controllers: [FaucetController, BetController, ChainController],
  exports: [
    ChainConfig,
    SolanaService,
    MarketService,
    ProvablyFairService,
    DuelChainService,
    PackChainService,
  ],
})
export class ChainModule {}
