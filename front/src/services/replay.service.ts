import { api } from '@/services/http';
import type { FixtureDto } from '@/services/txline.service';

/** A finished fixture the backend can replay (mirrors the api ReplayCatalogItem). */
export interface ReplayCatalogItem {
  fixtureId: number;
  home: string;
  away: string;
  competition: string;
  startTime: number;
  epochDay: number;
  startHour: number;
}

export interface StartReplayInput {
  fixtureId: number;
  epochDay: number;
  startHour: number;
  hours?: number;
  speed?: number;
}

/** One notable moment on a fixture's timeline (mirrors the api TimelineEvent). */
export interface TimelineEvent {
  minute: number;
  action: string;
  participant?: number;
  home: number;
  away: number;
}

export interface FixtureTimeline {
  fixtureId: number;
  events: TimelineEvent[];
  finalHome: number;
  finalAway: number;
  durationMin: number;
}

/** A notable thing that happened in a fixture (goal, card, corner…). */
export interface FixtureAction {
  action: string;
  minute?: number;
  participant?: number;
}

/** One bookmaker market in a fixture's latest-odds snapshot (mirrors the api OddsSnapshotItemDto). */
export interface OddsSnapshotItem {
  FixtureId: number;
  Ts: number;
  Bookmaker: string;
  /** Market family, e.g. 1X2 / OverUnder. */
  SuperOddsType: string;
  InRunning: boolean;
  MarketPeriod?: string;
  /** Line qualifier, e.g. `line=2.5` on OVERUNDER families. */
  MarketParameters?: string;
  PriceNames?: string[];
  /** Raw integer prices (decimal odds ×1000). */
  Prices?: number[];
}

/** One home/away counter pair. */
export interface StatTally {
  home: number;
  away: number;
}

/**
 * Authoritative team stats for a fixture, tallied from the FULL scores snapshot (mirrors the api
 * FixtureStatsDto). Only stats TxLINE actually carries as events — no possession % / passes.
 */
export interface FixtureStats {
  fixtureId: number;
  shots: StatTally;
  shotsOnTarget: StatTally;
  fouls: StatTally;
  corners: StatTally;
  yellowCards: StatTally;
  redCards: StatTally;
  offsides: StatTally;
  minute?: number;
  finished: boolean;
}

/** Authoritative current/final score for a fixture (mirrors the api FixtureScoreDto). */
export interface FixtureScore {
  fixtureId: number;
  /** Total goals — includes extra time on knockout fixtures. */
  home: number;
  away: number;
  /** Regulation-time (H1+H2) goals — standard 1X2/OU settlement basis, when the wire broke periods down. */
  regulationHome?: number;
  regulationAway?: number;
  minute?: number;
  finished: boolean;
  hasScore: boolean;
  actions: FixtureAction[];
}

/**
 * Talks to our backend's TxLINE replay endpoints. This is a real-backend test
 * surface, so (unlike most services) it never short-circuits on the mock flag.
 */
export const replayService = {
  getCatalog: (days = 6) => api.get<ReplayCatalogItem[]>(`/replay/catalog?days=${days}`),
  getUpcoming: () => api.get<FixtureDto[]>('/fixtures'),
  getScore: (fixtureId: number) => api.get<FixtureScore>(`/fixtures/${fixtureId}/score`),
  getStats: (fixtureId: number) => api.get<FixtureStats>(`/fixtures/${fixtureId}/stats`),
  getOdds: (fixtureId: number) => api.get<OddsSnapshotItem[]>(`/fixtures/${fixtureId}/odds`),
  getTimeline: (input: { fixtureId: number; epochDay: number; startHour: number }) =>
    api.get<FixtureTimeline>(
      `/replay/timeline?fixtureId=${input.fixtureId}&epochDay=${input.epochDay}&startHour=${input.startHour}`,
    ),
  start: (input: StartReplayInput) => api.post<{ started: boolean; fixtureId: number }>('/replay', input),
  stop: () => api.post<{ stopped: boolean }>('/replay/stop'),
};
