import { Global, Module } from '@nestjs/common';

import { CacheService } from './cache.service';

/** Global read-through cache (Redis + in-memory fallback) — import once in AppModule. */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
