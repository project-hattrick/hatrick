import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORE_CATALOG_SEED } from '@/config/store-catalog.config';

interface ShopStore {
  /** Remaining units per product slug (mock mode — the server owns real stock). */
  stock: Record<string, number>;
  /** Claim one unit locally; floors at zero. */
  decrement: (slug: string) => void;
  reset: () => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const SEED_STOCK: Record<string, number> = Object.fromEntries(
  STORE_CATALOG_SEED.map((item) => [item.slug, item.stock]),
);

/** Mock-mode shop stock — persisted so sold-out survives reloads without a backend. */
export const useShopStore = create<ShopStore>()(
  persist(
    (set) => ({
      stock: SEED_STOCK,
      decrement: (slug) =>
        set((state) => ({
          stock: { ...state.stock, [slug]: Math.max(0, (state.stock[slug] ?? 0) - 1) },
        })),
      reset: () => set({ stock: SEED_STOCK }),
    }),
    {
      name: 'hat-trick-shop',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);
