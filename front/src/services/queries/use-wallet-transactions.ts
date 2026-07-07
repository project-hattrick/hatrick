'use client';

import { useQuery } from '@tanstack/react-query';

import { walletService } from '@/services/wallet.service';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from './keys';

/**
 * The signed-in user's coin ledger (server-backed). Only runs when authenticated —
 * guests have no server wallet, so the panel renders its empty state instead.
 */
export function useWalletTransactions() {
  const isAuthed = useAuthStore((s) => s.status === 'authed');

  return useQuery({
    queryKey: queryKeys.walletTransactions(),
    queryFn: ({ signal }) => walletService.transactions(signal),
    enabled: backendEnabled && isAuthed,
    staleTime: 30_000,
  });
}
