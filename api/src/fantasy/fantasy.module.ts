import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
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
    UsersModule, // UserRepository + WalletRepository for the ledger
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
