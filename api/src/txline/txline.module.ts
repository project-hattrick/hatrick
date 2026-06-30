import { Module } from '@nestjs/common';

import { TxlineAuthService } from './txline-auth.service';
import { TxlineHttpService } from './txline-http.service';
import { TxlineIngestService } from './txline-ingest.service';
import { TxlineNormalizerService } from './txline-normalizer.service';
import { TxlineSnapshotService } from './txline-snapshot.service';
import { TournamentStateService } from './tournament-state.service';
import { TxlineController } from './txline.controller';

@Module({
  controllers: [TxlineController],
  providers: [
    TxlineAuthService,
    TxlineHttpService,
    TxlineIngestService,
    TxlineNormalizerService,
    TxlineSnapshotService,
    TournamentStateService,
  ],
  exports: [TournamentStateService, TxlineSnapshotService],
})
export class TxlineModule {}
