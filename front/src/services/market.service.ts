import { endpoints } from './endpoints';
import { api } from './http';

/** Trade echoes the resulting balance so the wallet can reconcile. */
export interface MarketResult {
  balance: string;
}

/**
 * Card market economy seam (play-money). Buys/sells move coins through the server
 * ledger (guarded, self-scoped via the session cookie) and return the new balance.
 * The collection/listings themselves remain client-side for now.
 */
export const marketService = {
  buy: (cardName: string, price: number): Promise<MarketResult> =>
    api.post<MarketResult>(endpoints.market.buy, { cardName, price }),

  sell: (cardName: string, price: number): Promise<MarketResult> =>
    api.post<MarketResult>(endpoints.market.sell, { cardName, price }),
};
