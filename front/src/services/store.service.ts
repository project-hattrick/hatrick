import { endpoints } from './endpoints';
import { api } from './http';
import { STORE_CATALOG_SEED } from '@/config/store-catalog.config';
import { toPackCard, type CollectionCard } from './fantasy.service';

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
  cards?: CollectionCard[];
}

interface StorePurchaseWireResult {
  balance: string;
  stock: number;
  slug: string;
  cards?: Parameters<typeof toPackCard>[0][];
}

/**
 * Limited-stock team store seam. The catalog is public; a purchase claims one
 * unit atomically on the server (guarded, self-scoped via the session cookie)
 * and returns the new balance + remaining stock.
 */
export const storeService = {
  catalog: async (signal?: AbortSignal): Promise<StoreItem[]> => {
    try {
      return await api.get<StoreItem[]>(endpoints.store.catalog, signal);
    } catch (error) {
      const message = (error as Error)?.message ?? '';
      if (message.includes('404')) return STORE_CATALOG_SEED.map((item) => ({ ...item }));
      throw error;
    }
  },

  purchase: async (slug: string): Promise<StorePurchaseResult> => {
    const result = await api.post<StorePurchaseWireResult>(endpoints.store.purchase, { slug });
    return { ...result, cards: result.cards?.map(toPackCard) };
  },
};
