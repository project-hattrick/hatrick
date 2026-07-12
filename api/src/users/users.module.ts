import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import {
  FriendshipRepository,
  NotificationRepository,
  UserRepository,
  WalletRepository,
} from './repositories';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserGateway } from './user.gateway';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  // forwardRef: AuthModule imports UsersModule (UserRepository) and UsersModule
  // needs AuthModule's JwtAuthGuard — a resolvable cycle.
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController, NotificationsController, FriendsController],
  providers: [
    UsersService,
    NotificationsService,
    FriendsService,
    UserGateway,
    UserRepository,
    FriendshipRepository,
    WalletRepository,
    NotificationRepository,
  ],
  exports: [
    UserRepository,
    FriendshipRepository,
    WalletRepository,
    NotificationRepository,
    NotificationsService,
  ],
})
export class UsersModule {}
