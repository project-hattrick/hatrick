'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { chainService, ChainTxKind } from '@/services/chain.service';
import { fantasyService, type CollectionCard } from '@/services/fantasy.service';
import type { PackCard } from '@/config/pack-pool.config';
import { useFantasyStore } from '@/store/fantasy.store';
import { useRefreshChainBalance } from './use-chain-balance';

const fromBase64 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export interface OpenPackOnChainInput {
  /** Store catalog template (maps to the pack variant on-chain). */
  templateId: string;
  packType: string;
}

/**
 * Returns a `resolveDeck` callback for <PackOpening> that runs the full on-chain
 * pack-open flow: build tx → sign+send (burns pack token) → chain/confirm → fulfill
 * (mint cNFTs) → return cards.
 *
 * Only call when `isChainSession()` is true. The play-money path (`usePackDeck`) is
 * the fallback when the chain flag is off.
 */
export function useOpenPackOnChain({ templateId, packType }: OpenPackOnChainInput) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const addToCollection = useFantasyStore((s) => s.addToCollection);
  const refreshBalance = useRefreshChainBalance();

  return useCallback(
    async (_size: number): Promise<PackCard[]> => {
      if (!publicKey) {
        toast.error('Connect your wallet to open this pack on-chain.');
        throw new Error('Wallet not connected');
      }

      // Client-generated idempotency key — scopes all three backend calls to one pack open.
      const packOpeningId = crypto.randomUUID();

      let buildResult;
      try {
        buildResult = await chainService.buildOpenPack({ templateId, packType, packOpeningId });
      } catch (e) {
        toast.error((e as Error)?.message ?? 'Could not prepare the pack transaction');
        throw e;
      }

      const { transaction, packOpenId, packMint } = buildResult;
      let signature: string;
      try {
        const tx = Transaction.from(fromBase64(transaction));
        signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(signature, 'confirmed');
      } catch (e) {
        toast.error('Transaction rejected or failed to confirm.');
        throw e;
      }

      try {
        await chainService.confirm(signature, ChainTxKind.OpenPack);
      } catch {
        // Non-fatal: fulfill still works; the server reconciles on fulfill.
      }

      let fulfillResult;
      try {
        fulfillResult = await chainService.fulfillPack(packOpenId, {
          packMint,
          templateId,
          packType,
          packOpeningId,
        });
      } catch (e) {
        toast.error((e as Error)?.message ?? 'Pack fulfill failed — contact support with your tx sig');
        throw e;
      }

      // Map fulfill cards to the fantasy collection shape using the shared mapper.
      // fulfillPack returns { ownedCardId, assetMint, realPlayerId } — we need to
      // call /fantasy/collection to get the full card shape (the server already
      // persisted them via fulfill). For a snappy UX we call collection() after.
      let collectionCards: CollectionCard[];
      try {
        collectionCards = await fantasyService.collection();
      } catch {
        collectionCards = [];
      }

      // Add any card that came from this fulfill (matched by ownedCardId).
      const mintedIds = new Set(fulfillResult.cards.map((c) => c.ownedCardId));
      const newCards = collectionCards.filter((c) => c.ownedCardId && mintedIds.has(c.ownedCardId));
      if (newCards.length) addToCollection(newCards);
      refreshBalance();

      return newCards as PackCard[];
    },
    [publicKey, templateId, packType, connection, sendTransaction, addToCollection, refreshBalance],
  );
}
