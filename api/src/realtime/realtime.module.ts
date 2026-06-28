import { Module } from '@nestjs/common';

import { RealtimeGateway } from './realtime.gateway';
import { TxlineModule } from '../txline/txline.module';

@Module({
  imports: [TxlineModule],
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
