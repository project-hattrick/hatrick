'use client';

import { useCallback } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import { useAuthStore } from '@/store/auth.store';

/**
 * Gate for sensitive actions (bet, open pack, save progress). Call the returned
 * function first: if the user isn't signed in, it opens the wallet modal
 * (connect → auto sign-in via WalletAuthSync) and returns false so the caller
 * can abort. Returns true when a valid session already exists.
 */
export function useRequireAuth(): () => boolean {
  const { setVisible } = useWalletModal();
  const status = useAuthStore((s) => s.status);

  return useCallback(() => {
    if (status === 'authed') return true;
    setVisible(true);
    return false;
  }, [status, setVisible]);
}
