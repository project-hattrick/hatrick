import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { BetsController } from './bets.controller';
import { MarketsController } from './markets.controller';
import { BetSettlementService, BettingService, MarketProjectorService } from './services';
import { BetRepository, MarketListingRepository } from './repositories';

@Module({
  imports: [
    UsersModule, // WalletRepository + UserRepository for the ledger; NotificationsService
    AuthModule, // JwtAuthGuard
  ],
  controllers: [BetsController, MarketsController],
  providers: [
    MarketProjectorService,
    BettingService,
    BetSettlementService,
    BetRepository,
    MarketListingRepository,
  ],
  exports: [BetRepository, MarketListingRepository, MarketProjectorService],
})
export class LiveModule {}
