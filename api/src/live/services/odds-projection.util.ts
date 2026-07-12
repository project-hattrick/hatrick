import { MarketSelection, MarketType } from '../../events/enums';
import type { MarketViewPayload, MarketSelectionView } from '../../events/dto';
import type { OddsEventPayload } from '../../events/dto';

/**
 * Server-side mirror of the front's `lib/live-odds.ts` mapping — the single place that turns a
 * raw TxLINE odds message into a normalized, tradeable `MarketType` view. Wire vocabulary observed
 * live (10/07/2026, docs/txline-provider.md): `1X2_PARTICIPANT_RESULT` prices `part1|draw|part2`;
 * `OVERUNDER_PARTICIPANT_GOALS` prices `over|under` with `MarketParameters: "line=X"`; prices are
 * decimal odds ×1000. Keep the two in sync — front renders these, backend settles them.
 */

/** The only TotalGoals line the product offers, so settlement can resolve it (see bet-settlement). */
export const TOTAL_GOALS_LINE = 2.5;

const canon = (value: string): string => value.toLowerCase().replace(/[^a-z0-9.=]/g, '');

/** Wire prices are decimal odds ×1000 — tolerate feeds that already send decimals. */
function toDecimal(price: number): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  const decimal = price > 100 ? price / 1000 : price;
  if (decimal < 1.01 || decimal > 100) return null;
  return Math.round(decimal * 100) / 100;
}

/** Full-match markets only — half/period markets don't belong on the main board. */
function isFullMatch(marketPeriod?: string): boolean {
  const period = (marketPeriod ?? '').trim().toLowerCase();
  return period === '' || period === 'total';
}

/** 1X2 price name → selection id (wire reality: `part1|draw|part2`); positional fallback. */
function matchResultSelection(name: string, index: number, count: number): string | null {
  const n = canon(name);
  if (n === '1' || n === 'home' || n === 'part1' || n === 'p1' || n === 'participant1') return MarketSelection.Home;
  if (n === 'x' || n === 'draw' || n === 'tie') return MarketSelection.Draw;
  if (n === '2' || n === 'away' || n === 'part2' || n === 'p2' || n === 'participant2') return MarketSelection.Away;
  if (count === 3) return index === 0 ? MarketSelection.Home : index === 1 ? MarketSelection.Draw : MarketSelection.Away;
  return null;
}

function overUnderSelection(name: string): string | null {
  const n = canon(name);
  if (n.startsWith('over') || n === 'o') return MarketSelection.Over;
  if (n.startsWith('under') || n === 'u') return MarketSelection.Under;
  return null;
}

/** Parse the goal line out of `MarketParameters` (e.g. `line=2.5` → 2.5). */
function parseLine(marketParameters?: string): number | null {
  const match = /line=([0-9]+(?:\.[0-9]+)?)/i.exec(marketParameters ?? '');
  return match ? Number(match[1]) : null;
}

/**
 * Project one odds message onto a normalized market, or `null` when it doesn't map to a board
 * market (period market, unpriced, unknown family). `settleable` is true only for markets the
 * backend can resolve on `match-end.after`.
 */
export function projectOdds(payload: OddsEventPayload): MarketViewPayload | null {
  const { priceNames, prices } = payload;
  if (!priceNames.length || priceNames.length !== prices.length) return null;
  if (!isFullMatch(payload.marketPeriod)) return null;

  const family = canon(payload.superOddsType);
  const isMatchResult = family.includes('1x2') || family.includes('matchresult') || family.includes('moneyline');
  const isTotalGoals = family.includes('overunder') || family.includes('totalgoal');
  if (!isMatchResult && !isTotalGoals) return null;

  const line = isTotalGoals ? parseLine(payload.marketParameters) ?? undefined : undefined;

  const selections: MarketSelectionView[] = [];
  priceNames.forEach((name, index) => {
    const price = toDecimal(prices[index]);
    if (price == null) return;
    const selection = isMatchResult
      ? matchResultSelection(name, index, priceNames.length)
      : overUnderSelection(name);
    if (selection) selections.push({ selection, price });
  });
  if (!selections.length) return null;

  const market = isMatchResult ? MarketType.MatchResult : MarketType.TotalGoals;
  const settleable = isMatchResult || line === TOTAL_GOALS_LINE;
  return { fixtureId: payload.fixtureId, market, line, settleable, selections, ts: payload.ts };
}
