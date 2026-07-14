'use client';

import { useMutation } from '@tanstack/react-query';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';

import { MarketType } from '@/enums';
import { betService } from '../bet.service';
import { chainService, ChainTxKind } from '../chain.service';
import { useRequireAuth } from './use-require-auth';
import { useRefreshChainBalance } from './use-chain-balance';

export interface PlaceBetVars {
  fixtureId: number;
  market: MarketType;
  selection: string;
  amount: number;
  oddsBps?: number;
}

const fromBase64 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/**
 * On-chain place_position: fetch the api-assembled transaction, have the wallet
 * sign + send it (real token escrow), and confirm. Returns the tx signature.
 */
export function usePlaceBet() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const requireAuth = useRequireAuth();
  const refreshBalance = useRefreshChainBalance();

  return useMutation({
    mutationFn: async (vars: PlaceBetVars): Promise<string> => {
      if (!requireAuth()) throw new Error('Sign in with your wallet to place a bet');
      if (!publicKey) throw new Error('Connect your wallet to place a bet');

      const { transaction } = await betService.buildPlaceBet({
        walletAddress: publicKey.toBase58(),
        ...vars,
      });
      const tx = Transaction.from(fromBase64(transaction));
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      await chainService.confirm(signature, ChainTxKind.Other);
      refreshBalance();
      return signature;
    },
  });
}
