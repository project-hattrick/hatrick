import { Module } from '@nestjs/common';

import { MarketProjectorService } from './market-projector.service';
import { BetRepository } from './bet.repository';

@Module({
  providers: [MarketProjectorService, BetRepository],
  exports: [BetRepository],
})
export class LiveModule {}
