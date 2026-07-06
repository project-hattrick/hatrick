import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { BetsController } from './bets.controller';
import { BettingService, MarketProjectorService } from './services';
import { BetRepository, MarketListingRepository } from './repositories';

@Module({
  imports: [
    UsersModule, // WalletRepository + UserRepository for the ledger
    AuthModule, // JwtAuthGuard
  ],
  controllers: [BetsController],
  providers: [MarketProjectorService, BettingService, BetRepository, MarketListingRepository],
  exports: [BetRepository, MarketListingRepository],
})
export class LiveModule {}
