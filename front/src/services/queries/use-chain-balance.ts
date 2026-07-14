'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { env } from '@/lib/env';
import { isBackendSession } from '@/services/session-mode';
import { chainService } from '@/services/chain.service';
import { queryKeys } from './keys';

/**
 * Fetches the on-chain balance (play token + USDC) from the backend.
 * Only runs when `NEXT_PUBLIC_CHAIN_ENABLED=true` and the user has an authed backend session.
 */
export function useChainBalance() {
  const { publicKey } = useWallet();
  const enabled = env.chainEnabled && isBackendSession() && publicKey !== null;

  return useQuery({
    queryKey: queryKeys.chainBalance(),
    queryFn: () => chainService.balance(),
    enabled,
    staleTime: 10_000,
  });
}

/** Returns a callback that re-fetches the on-chain balance (call after confirmed tx). */
export function useRefreshChainBalance() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.chainBalance() });
}
