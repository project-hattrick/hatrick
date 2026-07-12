import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CrowdController } from './crowd.controller';
import { CrowdGateway } from './crowd.gateway';
import { CrowdService } from './crowd.service';

@Module({
  imports: [
    UsersModule, // UserRepository for author labels
    AuthModule, // JwtAuthGuard
  ],
  controllers: [CrowdController],
  providers: [CrowdService, CrowdGateway],
})
export class CrowdModule {}
