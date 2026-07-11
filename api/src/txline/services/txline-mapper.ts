import { RawOddsEvent, RawScoreEvent } from '../txline.types';

/**
 * Adapts the real TxLINE wire schema to the internal Raw*Event shapes the
 * normalizer consumes. The provider changes shapes often, so this layer is
 * deliberately defensive: it tolerates both key casings, missing/renamed
 * nested objects, and unexpected types; it never throws; and it returns `null`
 * for events too broken to route (no fixtureId/ts) so callers can skip them.
 *
 * Observed reality (≠ the docs' lowercase schema):
 *   score: `FixtureId, Action, Ts, Seq, Confirmed, Participant, Clock:{Seconds},
 *           Score:{ParticipantN:{H1,HT,H2,Total}:{Goals,YellowCards,RedCards,Corners}},
 *           Stats:{}, PlayerStats:{}` — Action string is authoritative; `game_finalised`
 *           is full-time (GameState stays "scheduled").
 *   odds:  already Capitalized, matches RawOddsEvent.
 */

/** Loose view of a wire score event — every field optional, both casings. */
export interface WireScoreEvent {
  FixtureId?: unknown; fixtureId?: unknown;
  GameState?: unknown; gameState?: unknown;
  Action?: unknown; action?: unknown;
  Ts?: unknown; ts?: unknown;
  Seq?: unknown; seq?: unknown;
  Confirmed?: unknown; confirmed?: unknown;
  Participant?: unknown;
  Clock?: { Running?: unknown; Seconds?: unknown } | null;
  Score?: unknown; scoreSoccer?: unknown; ScoreSoccer?: unknown;
  PlayerStats?: unknown;
  Stats?: unknown;
  [key: string]: unknown;
}

export interface WireOddsEvent {
  FixtureId?: unknown; fixtureId?: unknown;
  MessageId?: unknown;
  Ts?: unknown; ts?: unknown;
  Bookmaker?: unknown; BookmakerId?: unknown;
  SuperOddsType?: unknown;
  InRunning?: unknown;
  MarketPeriod?: unknown; MarketParameters?: unknown;
  PriceNames?: unknown; Prices?: unknown; Pct?: unknown;
  [key: string]: unknown;
}

// ---- safe coercion primitives (never throw) ----
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const numOr = (fallback: number, ...v: unknown[]): number => {
  for (const x of v) {
    if (typeof x === 'number' && Number.isFinite(x)) return x;
    if (typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x))) return Number(x);
  }
  return fallback;
};
const strOr = (fallback: string, ...v: unknown[]): string => {
  for (const x of v) if (typeof x === 'string' && x.length) return x;
  return fallback;
};
const boolOf = (...v: unknown[]): boolean => v.some((x) => x === true || x === 'true');
const arrOf = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
/** Safely walk a nested path, returning a finite number or undefined. */
function deepNum(obj: unknown, ...path: string[]): number | undefined {
  let cur: unknown = obj;
  for (const k of path) {
    if (!isObj(cur)) return undefined;
    cur = cur[k];
  }
  return typeof cur === 'number' && Number.isFinite(cur) ? cur : undefined;
}

/** `safe_possession` → `Safe`, `high_danger_possession` → `HighDanger`, etc. */
function possessionType(action: string): string | undefined {
  if (action.includes('high_danger')) return 'HighDanger';
  if (action.includes('danger')) return 'Danger';
  if (action.includes('attack')) return 'Attack';
  if (action.includes('possession')) return 'Safe';
  return undefined;
}

/** Cumulative Total.Goals for a participant, tolerating flat-number fallbacks. */
export function goalsFromScore(score: unknown, participantKey: string): number | undefined {
  if (!isObj(score)) return undefined;
  const p = score[participantKey];
  if (typeof p === 'number') return Number.isFinite(p) ? p : undefined; // synthetic flat shape
  return deepNum(p, 'Total', 'Goals') ?? deepNum(p, 'total', 'Goals');
}

/** Map a wire score event → internal RawScoreEvent, or null if unroutable. */
export function mapWireScore(w: WireScoreEvent): RawScoreEvent | null {
  if (!isObj(w)) return null;
  const fixtureId = numOr(0, w.FixtureId, w.fixtureId);
  const ts = numOr(0, w.Ts, w.ts);
  if (!fixtureId || !ts) return null; // can't route without identity/order

  const action = strOr('', w.Action, w.action).toLowerCase();
  const seconds = isObj(w.Clock) ? w.Clock.Seconds : undefined;
  const minutes = typeof seconds === 'number' && Number.isFinite(seconds) ? Math.floor(seconds / 60) : undefined;
  // GameState can stay "scheduled" all match; the real full-time signal is the action.
  const rawGameState = strOr('', w.GameState, w.gameState) || undefined;
  const gameState = action === 'game_finalised' ? 'FullTime' : rawGameState;

  // Authoritative cumulative score object (real key is `Score`; tolerate aliases).
  const scoreSoccer = (w.Score ?? w.scoreSoccer ?? w.ScoreSoccer) as Record<string, unknown> | undefined;
  const participant = numOr(0, w.Participant) || undefined;
  // The Score blob is sparse: a participant with 0 goals omits the `Goals` key.
  // So when a Score object exists, an absent count means 0 (not "unknown").
  const hasScore = isObj(scoreSoccer);

  return {
    fixtureId,
    gameState,
    action,
    ts,
    seq: numOr(0, w.Seq, w.seq),
    confirmed: boolOf(w.Confirmed, w.confirmed),
    possessionType: possessionType(action),
    scoreSoccer: hasScore ? scoreSoccer : undefined,
    homeGoals: hasScore ? (goalsFromScore(scoreSoccer, 'Participant1') ?? 0) : undefined,
    awayGoals: hasScore ? (goalsFromScore(scoreSoccer, 'Participant2') ?? 0) : undefined,
    playerStats: isObj(w.PlayerStats) && Object.keys(w.PlayerStats).length ? w.PlayerStats : undefined,
    dataSoccer: {
      Action: action,
      Minutes: minutes,
      Participant: participant,
      Goal: action === 'goal',
      YellowCard: action === 'yellow_card',
      RedCard: action === 'red_card',
      Corner: action === 'corner',
      Penalty: action.includes('penalty'),
      VAR: action.includes('var'),
    },
  };
}

/** Map a wire odds event → internal RawOddsEvent, or null if unroutable. */
export function mapWireOdds(w: WireOddsEvent): RawOddsEvent | null {
  if (!isObj(w)) return null;
  const FixtureId = numOr(0, w.FixtureId, w.fixtureId);
  const Ts = numOr(0, w.Ts, w.ts);
  if (!FixtureId || !Ts) return null;
  return {
    FixtureId,
    MessageId: strOr('', w.MessageId),
    Ts,
    Bookmaker: strOr('', w.Bookmaker),
    BookmakerId: numOr(0, w.BookmakerId),
    SuperOddsType: strOr('', w.SuperOddsType),
    InRunning: boolOf(w.InRunning),
    MarketPeriod: typeof w.MarketPeriod === 'string' ? w.MarketPeriod : undefined,
    MarketParameters: typeof w.MarketParameters === 'string' ? w.MarketParameters : undefined,
    PriceNames: arrOf<string>(w.PriceNames),
    // Raw integer prices (decimal odds × 1000). Kept raw on purpose — dividing
    // here would silently break if the provider changes the scale factor.
    Prices: arrOf<number>(w.Prices),
    Pct: arrOf<string>(w.Pct),
  };
}
