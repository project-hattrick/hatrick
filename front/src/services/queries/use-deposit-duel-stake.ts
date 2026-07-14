'use client';

import { useMutation } from '@tanstack/react-query';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { chainService, ChainTxKind } from '@/services/chain.service';
import { useRefreshChainBalance } from './use-chain-balance';

const fromBase64 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/**
 * On-chain duel deposit: builds the unsigned deposit tx server-side, signs+sends it,
 * then confirms. Returns the transaction signature.
 *
 * Usage: only call when `isChainSession()` is true; the caller (DuelSetup) gates this.
 */
export function useDepositDuelStake() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const refreshBalance = useRefreshChainBalance();

  return useMutation({
    mutationFn: async (duelId: string): Promise<string> => {
      if (!publicKey) throw new Error('Connect your wallet to deposit the duel stake');

      const { transaction } = await chainService.buildDuelDeposit(duelId, publicKey.toBase58());
      const tx = Transaction.from(fromBase64(transaction));
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      await chainService.confirm(signature, ChainTxKind.Deposit);
      refreshBalance();
      return signature;
    },
  });
}
