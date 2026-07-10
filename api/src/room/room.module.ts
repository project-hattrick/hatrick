import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RoomController } from './room.controller';
import { RoomGateway } from './room.gateway';
import {
  RoomMemberRepository,
  RoomMessageRepository,
  RoomRepository,
} from './repositories';
import { RoomService } from './services';

@Module({
  imports: [
    AuthModule, // JwtAuthGuard
  ],
  controllers: [RoomController],
  providers: [
    RoomService,
    RoomGateway,
    RoomRepository,
    RoomMemberRepository,
    RoomMessageRepository,
  ],
  exports: [RoomRepository, RoomMemberRepository, RoomMessageRepository, RoomGateway],
})
export class RoomModule {}
