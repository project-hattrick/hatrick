import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

/** Read access to the auditable coin ledger (wallet_transactions). */
@Module({
  imports: [
    UsersModule, // provides WalletRepository
    AuthModule, // provides JwtAuthGuard
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
