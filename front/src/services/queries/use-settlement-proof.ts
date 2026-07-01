'use client';

import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';

import { MarketType } from '@/enums';
import { env } from '@/lib/env';
import { decodeMarket, deriveMarketId, marketPda, MarketStatus, outcomeLabel, toHex } from '@/lib/hat-trick';

export interface SettlementProof {
  settled: boolean;
  status: MarketStatus;
  outcome: string | null;
  merkleRoot: string;
  resultHash: string;
  totalPool: string;
  winningPool: string;
  marketAddress: string;
  explorerUrl: string;
}

/**
 * Reads the on-chain market for a fixture and exposes its settlement proof
 * (status, outcome, TxLINE Merkle root, result hash, explorer link) for the
 * "Ver prova do resultado" panel. Returns null when no market exists yet.
 */
export function useSettlementProof(fixtureId: number, market: MarketType = MarketType.MatchResult) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['settlement-proof', fixtureId, market],
    refetchInterval: 15_000,
    queryFn: async (): Promise<SettlementProof | null> => {
      const pda = marketPda(deriveMarketId(fixtureId, market));
      const info = await connection.getAccountInfo(pda);
      if (!info) return null;

      const m = decodeMarket(new Uint8Array(info.data));
      return {
        settled: m.status === MarketStatus.Settled,
        status: m.status,
        outcome: outcomeLabel(m.winningSelection),
        merkleRoot: toHex(m.merkleRoot),
        resultHash: toHex(m.resultHash),
        totalPool: m.totalPool.toString(),
        winningPool: m.winningPool.toString(),
        marketAddress: pda.toBase58(),
        explorerUrl: `https://explorer.solana.com/address/${pda.toBase58()}?cluster=${env.solanaCluster}`,
      };
    },
  });
}
