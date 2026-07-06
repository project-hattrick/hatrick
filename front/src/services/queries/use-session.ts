'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { authService, type AuthUser } from '@/services/auth.service';
import { ApiError } from '@/services/http';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { useWalletStore } from '@/store/wallet.store';
import { queryKeys } from './keys';

/** GET /auth/me → user, or null when the cookie is absent/expired (401). */
async function fetchSession(signal?: AbortSignal): Promise<AuthUser | null> {
  try {
    return await authService.me(signal);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

/**
 * BOOT hydration — mount once (in WalletAuthSync). Validates the httpOnly session
 * cookie against the server and syncs the auth store, so a reload keeps you signed
 * in without a new signature (and a stale/expired cookie resolves to guest).
 */
export function useSession() {
  const setSession = useAuthStore((s) => s.setSession);
  const setGuest = useAuthStore((s) => s.setGuest);
  const hydrateProfile = useProfileStore((s) => s.hydrateFromServer);
  const hydrateWallet = useWalletStore((s) => s.hydrate);
  const resetWallet = useWalletStore((s) => s.reset);

  const query = useQuery({
    queryKey: queryKeys.authMe(),
    queryFn: ({ signal }) => fetchSession(signal),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    if (query.data) {
      setSession(query.data);
      hydrateProfile(query.data);
      hydrateWallet(Number(query.data.balance));
    } else {
      setGuest();
      resetWallet();
    }
  }, [query.isSuccess, query.data, setSession, setGuest, hydrateProfile, hydrateWallet, resetWallet]);

  return query;
}
