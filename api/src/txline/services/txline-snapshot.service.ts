import { Injectable, Logger } from '@nestjs/common';

import { TxlineAuthService } from './txline-auth.service';
import { TxlineHttpService } from './txline-http.service';
import { mapWireScore, WireScoreEvent } from './txline-mapper';
import { RawFixture, RawOddsEvent, RawScoreEvent, StreamKind } from '../txline.types';

export interface FixturesQuery {
  startEpochDay?: number;
  competitionId?: number;
}

/** A notable thing that happened in a fixture (goal, card, corner…). */
export interface FixtureAction {
  action: string;
  minute?: number;
  participant?: number;
}

/** Authoritative score for a fixture (reduced from the scores snapshot). */
export interface FixtureScore {
  fixtureId: number;
  home: number;
  away: number;
  minute?: number;
  finished: boolean;
  hasScore: boolean;
  actions: FixtureAction[];
}

const FULL_TIME = /full[\s-]?time|finished|ended|\bft\b/i;
const NOTABLE_ACTIONS = new Set(['goal', 'yellow_card', 'red_card', 'corner', 'penalty']);

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

  /**
   * The authoritative current/final score for one fixture — the correct baseline before the SSE
   * stream (docs/txline-provider.md: score is `Score.ParticipantN.Total.Goals`, never a goal count).
   * Reduces the snapshot to the highest-seq event that carries a Score object.
   */
  async getFixtureScore(fixtureId: number): Promise<FixtureScore> {
    const wire = await this.guard(() =>
      this.http.get<Record<string, unknown>[]>(`/api/scores/snapshot/${fixtureId}`),
    );

    let home = 0;
    let away = 0;
    let minute: number | undefined;
    let bestSeq = -1;
    let finished = false;
    let hasScore = false;
    const seen = new Set<string>();
    const actions: FixtureAction[] = [];

    for (const item of wire) {
      const raw = mapWireScore(item as WireScoreEvent);
      if (!raw) continue;
      if (raw.gameState && FULL_TIME.test(raw.gameState)) finished = true;

      // Collect the notable things that happened (goals, cards, corners…) for the recap feed.
      if (raw.action && NOTABLE_ACTIONS.has(raw.action)) {
        const min = raw.dataSoccer?.Minutes;
        const participant = raw.dataSoccer?.Participant;
        const key = `${raw.action}:${min ?? '?'}:${participant ?? '?'}`;
        if (!seen.has(key)) {
          seen.add(key);
          actions.push({ action: raw.action, minute: min, participant });
        }
      }

      // Only events that carry the authoritative Score object update the tally.
      if (raw.homeGoals === undefined && raw.awayGoals === undefined) continue;
      if (raw.seq < bestSeq) continue;
      bestSeq = raw.seq;
      home = raw.homeGoals ?? 0;
      away = raw.awayGoals ?? 0;
      minute = raw.dataSoccer?.Minutes ?? minute;
      hasScore = true;
    }

    actions.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
    return { fixtureId, home, away, minute, finished, hasScore, actions: actions.slice(0, 12) };
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
