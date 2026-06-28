import { Module } from '@nestjs/common';

import { MarketProjectorService } from './market-projector.service';

@Module({
  providers: [MarketProjectorService],
})
export class LiveModule {}
