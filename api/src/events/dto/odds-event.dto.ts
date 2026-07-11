/** Normalized odds update payload. */
export interface OddsEventPayload {
  fixtureId: number;
  bookmaker: string;
  superOddsType: string;
  inRunning: boolean;
  /** H1 / HT / H2 / Total (null/absent = full match). */
  marketPeriod?: string;
  /** Line qualifier, e.g. `line=2.5` on OVERUNDER families. */
  marketParameters?: string;
  priceNames: string[];
  prices: number[];
  ts: number;
}
