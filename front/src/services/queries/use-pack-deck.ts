'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

import { drawPack, type PackCard } from '@/config/pack-pool.config';
import { fantasyService, PackType } from '@/services/fantasy.service';
import { useAuthStore } from '@/store/auth.store';
import { useWalletStore } from '@/store/wallet.store';

/**
 * Deck resolver for <PackOpening resolveDeck>. When signed in, the pack is drawn
 * server-side (POST /fantasy/packs/open) — the owned cards are persisted, coins are
 * debited, and the reveal animates the authoritative cards. Guests fall back to the
 * local client draw. The wallet reconciles from the returned balance.
 */
export function usePackDeck(type: PackType): (size: number) => Promise<PackCard[]> {
  const isAuthed = useAuthStore((s) => s.status === 'authed');
  const hydrateWallet = useWalletStore((s) => s.hydrate);

  return useCallback(
    async (size: number) => {
      if (!isAuthed) return drawPack(size);
      try {
        const { cards, balance } = await fantasyService.openPack(type);
        hydrateWallet(Number(balance));
        return cards;
      } catch (e) {
        toast.error((e as Error)?.message ?? 'Could not open the pack');
        throw e;
      }
    },
    [isAuthed, type, hydrateWallet],
  );
}
