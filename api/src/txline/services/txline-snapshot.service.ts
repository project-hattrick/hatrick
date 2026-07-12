import { Injectable, Logger } from '@nestjs/common';

import { TxlineAuthService } from './txline-auth.service';
import { historicalIntervalTtl, TxlineCacheTtl } from './txline-cache-ttl';
import { TxlineHttpService } from './txline-http.service';
import { mapWireScore, WireScoreEvent } from './txline-mapper';
import { deriveTeamStats, type TeamStats } from './txline-stats';
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

/** Authoritative team stats for a fixture (tallied from the FULL scores snapshot). */
export interface FixtureStats extends TeamStats {
  fixtureId: number;
  minute?: number;
  finished: boolean;
}

/** Authoritative score for a fixture (reduced from the scores snapshot). */
export interface FixtureScore {
  fixtureId: number;
  home: number;
  away: number;
  /**
   * Regulation-time (H1+H2) goals — `home/away` include extra time, so standard
   * 1X2 / Over-Under settlement uses these when present.
   */
  regulationHome?: number;
  regulationAway?: number;
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
      this.http.getCached<RawFixture[]>('/api/fixtures/snapshot', TxlineCacheTtl.FixturesSnapshot, {
        params: this.params(query),
      }),
    );
  }

  /**
   * Latest odds per market line. Without `asOf` the provider only answers from
   * the current 5-minute interval, which can be empty on quiet pre-match
   * fixtures — retry once against historical data in that case. The fallback's
   * `asOf` is bucketed to the 5-min interval so its cache key stays stable.
   */
  async getOddsSnapshot(fixtureId: number): Promise<RawOddsEvent[]> {
    const live = await this.guard(() =>
      this.http.getCached<RawOddsEvent[]>(`/api/odds/snapshot/${fixtureId}`, TxlineCacheTtl.OddsSnapshot),
    );
    if (live.length) return live;
    const asOf = Math.floor(Date.now() / 300_000) * 300_000;
    return this.guard(() =>
      this.http.getCached<RawOddsEvent[]>(`/api/odds/snapshot/${fixtureId}`, TxlineCacheTtl.OddsSnapshotAsOf, {
        params: { asOf },
      }),
    );
  }

  getScoresSnapshot(fixtureId: number): Promise<RawScoreEvent[]> {
    return this.guard(() =>
      this.http.getCached<RawScoreEvent[]>(`/api/scores/snapshot/${fixtureId}`, TxlineCacheTtl.ScoresSnapshot),
    );
  }

  /**
   * The authoritative current/final score for one fixture — the correct baseline before the SSE
   * stream (docs/txline-provider.md: score is `Score.ParticipantN.Total.Goals`, never a goal count).
   * Reduces the snapshot to the highest-seq event that carries a Score object.
   */
  async getFixtureScore(fixtureId: number): Promise<FixtureScore> {
    // Same key as getScoresSnapshot — one upstream call feeds both surfaces.
    const wire = await this.guard(() =>
      this.http.getCached<Record<string, unknown>[]>(
        `/api/scores/snapshot/${fixtureId}`,
        TxlineCacheTtl.ScoresSnapshot,
      ),
    );

    let home = 0;
    let away = 0;
    let regulationHome: number | undefined;
    let regulationAway: number | undefined;
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
      regulationHome = raw.regulationHomeGoals ?? regulationHome;
      regulationAway = raw.regulationAwayGoals ?? regulationAway;
      minute = raw.dataSoccer?.Minutes ?? minute;
      hasScore = true;
    }

    actions.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
    return {
      fixtureId, home, away, regulationHome, regulationAway,
      minute, finished, hasScore, actions: actions.slice(0, 12),
    };
  }

  /**
   * Authoritative team stats for a fixture. TxLINE only TOTALS Corners/YellowCards/RedCards (read from
   * the highest-seq `Score.Total`) — the scores snapshot returns the last event per action, so counting
   * actions undercounts badly. Shots come from summing sparse `PlayerStats.shots`; SOT/fouls/offsides
   * aren't totalled by the provider (0 here — the live socket tally fills them). Reuses the same cached
   * `/api/scores/snapshot` upstream as getFixtureScore (single-flight).
   */
  async getFixtureStats(fixtureId: number): Promise<FixtureStats> {
    const wire = await this.guard(() =>
      this.http.getCached<Record<string, unknown>[]>(
        `/api/scores/snapshot/${fixtureId}`,
        TxlineCacheTtl.ScoresSnapshot,
      ),
    );

    const events: RawScoreEvent[] = [];
    let minute: number | undefined;
    let finished = false;
    for (const item of wire) {
      const raw = mapWireScore(item as WireScoreEvent);
      if (!raw) continue;
      if (raw.gameState && FULL_TIME.test(raw.gameState)) finished = true;
      const min = raw.dataSoccer?.Minutes;
      if (typeof min === 'number' && min >= 0) minute = Math.max(minute ?? 0, min);
      events.push(raw);
    }

    return { fixtureId, minute, finished, ...deriveTeamStats(events) };
  }

  /**
   * Historical 5-min interval updates — backfill / deterministic demo replay.
   * A fully-passed interval is immutable, so it caches long; the current one bypasses.
   */
  getUpdates(kind: StreamKind, epochDay: number, hour: number, interval: number): Promise<unknown[]> {
    return this.guard(() =>
      this.http.getCached<unknown[]>(
        `/api/${kind}/updates/${epochDay}/${hour}/${interval}`,
        historicalIntervalTtl(epochDay, hour, interval),
      ),
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
