import { endpoints } from './endpoints';
import { api } from './http';

/** A limited-stock store product as the API catalog exposes it. */
export interface StoreItem {
  slug: string;
  kind: 'Pack' | 'Bundle' | 'Card';
  name: string;
  /** Price in coins (whole). */
  price: number;
  /** Remaining units — 0 means sold out. */
  stock: number;
}

/** Purchase result — new balance (wallet reconcile) + remaining stock. */
export interface StorePurchaseResult {
  balance: string;
  stock: number;
  slug: string;
}

/**
 * Limited-stock team store seam. The catalog is public; a purchase claims one
 * unit atomically on the server (guarded, self-scoped via the session cookie)
 * and returns the new balance + remaining stock.
 */
export const storeService = {
  catalog: (signal?: AbortSignal): Promise<StoreItem[]> => api.get<StoreItem[]>(endpoints.store.catalog, signal),

  purchase: (slug: string): Promise<StorePurchaseResult> =>
    api.post<StorePurchaseResult>(endpoints.store.purchase, { slug }),
};
