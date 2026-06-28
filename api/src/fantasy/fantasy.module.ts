import { Module } from '@nestjs/common';

import { AttributeEngineService } from './attribute-engine.service';

@Module({
  providers: [AttributeEngineService],
})
export class FantasyModule {}
