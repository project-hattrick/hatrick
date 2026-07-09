import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { storeService, type StoreItem } from '@/services/store.service';
import { backendEnabled } from '@/services/session-mode';
import { queryKeys } from './keys';
import { useRequireAuth } from './use-require-auth';
import { seedFor } from '@/config/store-catalog.config';
import { useShopStore } from '@/store/shop.store';
import { useWalletStore } from '@/store/wallet.store';

/** Server catalog of limited-stock items (public; mock mode never fetches). */
export function useStoreCatalog() {
  return useQuery({
    queryKey: queryKeys.storeCatalog(),
    queryFn: ({ signal }) => storeService.catalog(signal),
    enabled: backendEnabled,
    staleTime: 15_000,
  });
}

/**
 * Remaining stock for a product — the server catalog when backed, the persisted
 * mock shop otherwise. `undefined` while the catalog is still loading.
 */
export function useItemStock(slug: string): number | undefined {
  const { data } = useStoreCatalog();
  const mockStock = useShopStore((s) => s.stock[slug]);
  if (backendEnabled) return data?.find((item) => item.slug === slug)?.stock;
  return mockStock ?? seedFor(slug)?.stock ?? 0;
}

/**
 * Buy one unit of a store item. Resolves `true` on success (stock claimed +
 * coins debited); on failure it toasts the reason and resolves `false` so the
 * caller can keep its dialog open. Wallet + catalog caches are reconciled from
 * the server response; mock mode mutates the local ledgers.
 */
export function usePurchaseItem(): (slug: string) => Promise<boolean> {
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();

  return useCallback(
    async (slug) => {
      if (!requireAuth()) return false;

      if (backendEnabled) {
        try {
          const result = await storeService.purchase(slug);
          useWalletStore.getState().hydrate(Number(result.balance));
          queryClient.setQueryData<StoreItem[]>(queryKeys.storeCatalog(), (old) =>
            old?.map((item) => (item.slug === slug ? { ...item, stock: result.stock } : item)),
          );
          return true;
        } catch (error) {
          toast.error((error as Error)?.message ?? 'Purchase failed');
          return false;
        }
      }

      const seed = seedFor(slug);
      if (!seed) return false;
      const stock = useShopStore.getState().stock[slug] ?? seed.stock;
      if (stock <= 0) {
        toast.error('Sold out.');
        return false;
      }
      if (useWalletStore.getState().balance < seed.price) {
        toast.error('Not enough coins for this item.');
        return false;
      }
      useWalletStore.getState().debit(seed.price);
      useShopStore.getState().decrement(slug);
      return true;
    },
    [queryClient, requireAuth],
  );
}
