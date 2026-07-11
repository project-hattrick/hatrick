import { MarketType } from '@/enums/market-type.enum';
import type { OddsSnapshotItem } from '@/services/replay.service';

/** One wire odds message reduced to a market family + per-selection decimal odds. */
export interface LiveMarketOdds {
  market: MarketType;
  /** selectionId (home/draw/away/over/under) → decimal odds. */
  odds: Record<string, number>;
}

/** Market qualifiers accompanying an odds message (both live payloads and snapshot items). */
export interface LiveOddsContext {
  /** H1 / HT / H2 / Total — null/absent means the full match. */
  marketPeriod?: string | null;
  /** Line qualifier, e.g. `line=2.5` on OVERUNDER families. */
  marketParameters?: string | null;
}

/** Our Total Goals market is the 2.5 line — other lines from the wire must not overwrite it. */
const TOTAL_GOALS_LINE = 'line=2.5';

/** Wire prices are decimal odds ×1000 (raw integers) — tolerate already-decimal feeds. */
function toDecimal(price: number): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  const decimal = price > 100 ? price / 1000 : price;
  if (decimal < 1.01 || decimal > 100) return null;
  return Math.round(decimal * 100) / 100;
}

const canon = (value: string) => value.toLowerCase().replace(/[^a-z0-9.=]/g, '');

/** Full-match markets only — half/period markets don't belong on the main odds board. */
function isFullMatch(context: LiveOddsContext): boolean {
  const period = (context.marketPeriod ?? '').trim().toLowerCase();
  return period === '' || period === 'total';
}

/** 1X2 price name → our selection id (wire reality: `part1` / `draw` / `part2`); positional fallback. */
function matchResultSelection(name: string, index: number, count: number): string | null {
  const n = canon(name);
  if (n === '1' || n === 'home' || n === 'part1' || n === 'p1' || n === 'participant1') return 'home';
  if (n === 'x' || n === 'draw' || n === 'tie') return 'draw';
  if (n === '2' || n === 'away' || n === 'part2' || n === 'p2' || n === 'participant2') return 'away';
  if (count === 3) return index === 0 ? 'home' : index === 1 ? 'draw' : 'away';
  return null;
}

function overUnderSelection(name: string): string | null {
  const n = canon(name);
  if (n.startsWith('over') || n === 'o') return 'over';
  if (n.startsWith('under') || n === 'u') return 'under';
  return null;
}

/**
 * Map one TxLINE odds message onto the odds board's market/selection ids, or null when it doesn't
 * belong there. Vocabulary observed live (10/07/2026, docs/txline-provider.md pendência resolved):
 * `1X2_PARTICIPANT_RESULT` names `part1|draw|part2`; `OVERUNDER_PARTICIPANT_GOALS` names
 * `over|under` with `MarketParameters: "line=X"`; prices are decimal odds ×1000.
 */
export function mapLiveOdds(
  superOddsType: string,
  priceNames: string[],
  prices: number[],
  context: LiveOddsContext = {},
): LiveMarketOdds | null {
  if (!priceNames.length || priceNames.length !== prices.length) return null;
  if (!isFullMatch(context)) return null;
  const family = canon(superOddsType);

  const isMatchResult = family.includes('1x2') || family.includes('matchresult') || family.includes('moneyline');
  const isTotalGoals = family.includes('overunder') || family.includes('totalgoal');
  if (!isMatchResult && !isTotalGoals) return null;
  // Over/Under streams one message per goal line — only the 2.5 line maps to our Total Goals market.
  if (isTotalGoals && canon(context.marketParameters ?? '') !== TOTAL_GOALS_LINE) return null;

  const odds: Record<string, number> = {};
  priceNames.forEach((name, index) => {
    const decimal = toDecimal(prices[index]);
    if (decimal == null) return;
    const selectionId = isMatchResult
      ? matchResultSelection(name, index, priceNames.length)
      : overUnderSelection(name);
    if (selectionId) odds[selectionId] = decimal;
  });

  if (!Object.keys(odds).length) return null;
  return { market: isMatchResult ? MarketType.MatchResult : MarketType.TotalGoals, odds };
}

/**
 * Reduce a fixture's odds snapshot to its latest Match Result (1X2) prices, or null when the book
 * hasn't priced that market yet (fixtures far from kickoff often have nothing).
 */
export function foldResultOdds(items: OddsSnapshotItem[]): Record<string, number> | null {
  let book: Record<string, number> | null = null;
  for (const item of [...items].sort((a, b) => a.Ts - b.Ts)) {
    const mapped = mapLiveOdds(item.SuperOddsType, item.PriceNames ?? [], item.Prices ?? [], {
      marketPeriod: item.MarketPeriod,
      marketParameters: item.MarketParameters,
    });
    if (mapped?.market === MarketType.MatchResult) book = { ...(book ?? {}), ...mapped.odds };
  }
  return book;
}
