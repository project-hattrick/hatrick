import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { FantasyModule } from '../fantasy/fantasy.module';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';

/** Play-money card market economy (coin movements + ledger + owned-card mutations). */
@Module({
  imports: [
    UsersModule, // UserRepository + WalletRepository
    AuthModule, // JwtAuthGuard
    FantasyModule, // CardRepository + OwnedCardRepository
  ],
  controllers: [MarketController],
  providers: [MarketService],
})
export class MarketModule {}
