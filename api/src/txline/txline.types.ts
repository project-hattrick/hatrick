/** Minimal subset of TxLINE payloads we consume. Full schema: docs/txline-provider.md. */

export interface RawScoreEvent {
  fixtureId: number;
  gameState?: string;
  action?: string;
  ts: number;
  seq: number;
  /** false → emit `*.during` · true → emit `*.after` */
  confirmed: boolean;
  possession?: number;
  possessionType?: string;
  dataSoccer?: {
    Action?: string;
    Type?: string;
    PlayerId?: number;
    Participant?: number;
    Minutes?: number;
    Goal?: boolean;
    YellowCard?: boolean;
    RedCard?: boolean;
    Corner?: boolean;
    Penalty?: boolean;
    VAR?: boolean;
  };
  scoreSoccer?: Record<string, unknown>;
  /** Authoritative cumulative goals from the wire `Score` object (when present). */
  homeGoals?: number;
  awayGoals?: number;
  /** Per-player stats blob (`PlayerStats`) — feeds Fantasy attribute recalculation. */
  playerStats?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RawOddsEvent {
  FixtureId: number;
  MessageId: string;
  Ts: number;
  Bookmaker: string;
  BookmakerId: number;
  SuperOddsType: string;
  InRunning: boolean;
  MarketPeriod?: string;
  PriceNames?: string[];
  Prices?: number[];
  Pct?: string[];
  [key: string]: unknown;
}

export interface RawFixture {
  FixtureId: number;
  StartTime: number;
  Ts: number;
  Competition: string;
  CompetitionId: number;
  FixtureGroupId?: number;
  Participant1Id: number;
  Participant1: string;
  Participant2Id: number;
  Participant2: string;
  Participant1IsHome: boolean;
}

export type StreamKind = 'scores' | 'odds';
