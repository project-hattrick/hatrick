import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { UserGateway } from '../users/user.gateway';
import { FantasyController } from './fantasy.controller';
import { DuelController } from './duel.controller';
import { AttributeEngineService, DuelService, PackService, SquadService } from './services';
import {
  CardRepository,
  DuelRepository,
  OwnedCardRepository,
  PackRepository,
  SquadRepository,
} from './repositories';

@Module({
  imports: [
    AuthModule, // JwtAuthGuard
    UsersModule, // UserRepository + WalletRepository + UserGateway for the ledger + realtime
  ],
  controllers: [FantasyController, DuelController],
  providers: [
    AttributeEngineService,
    PackService,
    SquadService,
    DuelService,
    CardRepository,
    OwnedCardRepository,
    PackRepository,
    SquadRepository,
    DuelRepository,
    // UserGateway is exported by UsersModule and re-provided here so DuelService
    // can inject it without a circular module dependency.
    UserGateway,
  ],
  exports: [
    CardRepository,
    OwnedCardRepository,
    PackRepository,
    SquadRepository,
    DuelRepository,
  ],
})
export class FantasyModule {}
