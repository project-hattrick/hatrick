import { Injectable, Logger } from '@nestjs/common';

import { TxlineAuthService } from './txline-auth.service';
import { TxlineHttpService } from './txline-http.service';
import { RawFixture, RawOddsEvent, RawScoreEvent, StreamKind } from '../txline.types';

export interface FixturesQuery {
  startEpochDay?: number;
  competitionId?: number;
}

/**
 * REST snapshot wrappers for TxLINE initial state (docs/txline-provider.md).
 * Returns empty when no API token is configured, so the app stays boot-safe.
 */
@Injectable()
export class TxlineSnapshotService {
  private readonly logger = new Logger(TxlineSnapshotService.name);

  constructor(
    private readonly http: TxlineHttpService,
    private readonly auth: TxlineAuthService,
  ) {}

  getFixtures(query: FixturesQuery = {}): Promise<RawFixture[]> {
    return this.guard(() =>
      this.http.get<RawFixture[]>('/api/fixtures/snapshot', { params: this.params(query) }),
    );
  }

  getOddsSnapshot(fixtureId: number): Promise<RawOddsEvent[]> {
    return this.guard(() => this.http.get<RawOddsEvent[]>(`/api/odds/snapshot/${fixtureId}`));
  }

  getScoresSnapshot(fixtureId: number): Promise<RawScoreEvent[]> {
    return this.guard(() => this.http.get<RawScoreEvent[]>(`/api/scores/snapshot/${fixtureId}`));
  }

  /** Historical 5-min interval updates — backfill / deterministic demo replay. */
  getUpdates(kind: StreamKind, epochDay: number, hour: number, interval: number): Promise<unknown[]> {
    return this.guard(() =>
      this.http.get<unknown[]>(`/api/${kind}/updates/${epochDay}/${hour}/${interval}`),
    );
  }

  private async guard<T>(call: () => Promise<T[]>): Promise<T[]> {
    if (!this.auth.hasApiToken()) {
      this.logger.warn('TXLINE_API_TOKEN missing — returning empty snapshot.');
      return [];
    }
    return call();
  }

  private params(query: FixturesQuery): Record<string, number> {
    const out: Record<string, number> = {};
    if (query.startEpochDay !== undefined) out.startEpochDay = query.startEpochDay;
    if (query.competitionId !== undefined) out.competitionId = query.competitionId;
    return out;
  }
}
