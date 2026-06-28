import { Module } from '@nestjs/common';

import { CrowdService } from './crowd.service';

@Module({
  providers: [CrowdService],
})
export class CrowdModule {}
