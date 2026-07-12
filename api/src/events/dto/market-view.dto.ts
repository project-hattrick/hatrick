import { MarketType } from '../enums/market-type.enum';

/** One priced option inside a normalized market (selection id → decimal odds). */
export interface MarketSelectionView {
  /** `home|draw|away` for MatchResult, `over|under` for TotalGoals (see MarketSelection enum). */
  selection: string;
  /** Decimal odds (e.g. 1.85), already converted from the wire's ×1000 integers. */
  price: number;
}

/**
 * A tradeable market projected from a raw TxLINE odds update by MarketProjectorService.
 * Unlike `OddsEventPayload` (raw wire), this is normalized to our `MarketType` vocabulary
 * so the betting surface is data-driven instead of hand-assembled.
 */
export interface MarketViewPayload {
  fixtureId: number;
  market: MarketType;
  /** Line qualifier for over/under families, e.g. 2.5 (absent on MatchResult). */
  line?: number;
  /**
   * True when backend settlement can resolve this market on `match-end.after`
   * (MatchResult, and TotalGoals on the 2.5 line). View-only markets are `false`.
   */
  settleable: boolean;
  selections: MarketSelectionView[];
  ts: number;
}
