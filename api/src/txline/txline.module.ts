import { Module } from '@nestjs/common';

import { TxlineAuthService } from './txline-auth.service';
import { TxlineIngestService } from './txline-ingest.service';
import { TxlineNormalizerService } from './txline-normalizer.service';
import { TxlineSnapshotService } from './txline-snapshot.service';
import { TournamentStateService } from './tournament-state.service';

@Module({
  providers: [
    TxlineAuthService,
    TxlineIngestService,
    TxlineNormalizerService,
    TxlineSnapshotService,
    TournamentStateService,
  ],
  exports: [TournamentStateService, TxlineSnapshotService],
})
export class TxlineModule {}
