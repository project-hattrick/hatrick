import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import {
  FriendshipRepository,
  NotificationRepository,
  UserRepository,
  WalletRepository,
} from './repositories';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  // forwardRef: AuthModule imports UsersModule (UserRepository) and UsersModule
  // needs AuthModule's JwtAuthGuard — a resolvable cycle.
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    FriendshipRepository,
    WalletRepository,
    NotificationRepository,
  ],
  exports: [UserRepository, FriendshipRepository, WalletRepository, NotificationRepository],
})
export class UsersModule {}
