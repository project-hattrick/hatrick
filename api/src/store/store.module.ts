import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreItemRepository } from './repositories';

/** Limited-stock team store (catalog + atomic purchase → wallet ledger). */
@Module({
  imports: [
    UsersModule, // UserRepository + WalletRepository
    AuthModule, // JwtAuthGuard
  ],
  controllers: [StoreController],
  providers: [StoreService, StoreItemRepository],
})
export class StoreModule {}
