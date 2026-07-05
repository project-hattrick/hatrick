import { Module } from '@nestjs/common';

import { FriendshipRepository } from './friendship.repository';
import { NotificationRepository } from './notification.repository';
import { UserRepository } from './user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WalletRepository } from './wallet.repository';

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
