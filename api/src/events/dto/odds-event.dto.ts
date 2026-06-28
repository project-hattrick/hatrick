/** Normalized odds update payload. */
export interface OddsEventPayload {
  fixtureId: number;
  bookmaker: string;
  superOddsType: string;
  inRunning: boolean;
  priceNames: string[];
  prices: number[];
  ts: number;
}
