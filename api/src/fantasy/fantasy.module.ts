import { Module } from '@nestjs/common';

import { AttributeEngineService } from './attribute-engine.service';
import { CardRepository } from './card.repository';
import { DuelRepository } from './duel.repository';
import { OwnedCardRepository } from './owned-card.repository';
import { PackRepository } from './pack.repository';
import { SquadRepository } from './squad.repository';

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
