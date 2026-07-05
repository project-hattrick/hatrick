import { Module } from '@nestjs/common';

import { MarketProjectorService } from './services';
import { BetRepository, MarketListingRepository } from './repositories';

@Module({
  providers: [MarketProjectorService, BetRepository, MarketListingRepository],
  exports: [BetRepository, MarketListingRepository],
})
export class LiveModule {}
