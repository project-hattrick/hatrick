import { Module } from '@nestjs/common';

import { TxlineAuthService } from './services/txline-auth.service';
import { TxlineHttpService } from './services/txline-http.service';
import { TxlineIngestService } from './services/txline-ingest.service';
import { TxlineNormalizerService } from './services/txline-normalizer.service';
import { TxlineReplayService } from './services/txline-replay.service';
import { TxlineSnapshotService } from './services/txline-snapshot.service';
import { TournamentStateService } from './services/tournament-state.service';
import { TxlineController } from './txline.controller';

@Module({
  controllers: [TxlineController],
  providers: [
    TxlineAuthService,
    TxlineHttpService,
    TxlineIngestService,
    TxlineNormalizerService,
    TxlineReplayService,
    TxlineSnapshotService,
    TournamentStateService,
  ],
  exports: [TournamentStateService, TxlineSnapshotService],
})
export class TxlineModule {}
