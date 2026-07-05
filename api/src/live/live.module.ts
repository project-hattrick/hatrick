import { Module } from '@nestjs/common';

import { MarketProjectorService } from './market-projector.service';
import { BetRepository } from './bet.repository';
import { MarketListingRepository } from './market-listing.repository';

@Module({
  providers: [MarketProjectorService, BetRepository, MarketListingRepository],
  exports: [BetRepository, MarketListingRepository],
})
export class LiveModule {}
