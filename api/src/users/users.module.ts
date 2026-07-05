import { Module } from '@nestjs/common';

import {
  FriendshipRepository,
  NotificationRepository,
  UserRepository,
  WalletRepository,
} from './repositories';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
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
