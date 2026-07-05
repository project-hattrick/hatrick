import { Module } from '@nestjs/common';

import { AttributeEngineService } from './services';
import {
  CardRepository,
  DuelRepository,
  OwnedCardRepository,
  PackRepository,
  SquadRepository,
} from './repositories';

@Module({
  providers: [
    AttributeEngineService,
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
