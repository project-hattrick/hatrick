'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { authService, type AuthUser } from '@/services/auth.service';
import { ApiError } from '@/services/http';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { useWalletStore } from '@/store/wallet.store';
import { backendEnabled } from '@/services/session-mode';
import { queryKeys } from './keys';

/** GET /auth/session → user, or null when the cookie is absent/expired (401). */
async function fetchSession(signal?: AbortSignal): Promise<AuthUser | null> {
  try {
    return await authService.session(signal);
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
  const persistedUser = useAuthStore((s) => s.user);
  const hydrateProfile = useProfileStore((s) => s.hydrateFromServer);
  const hydrateWallet = useWalletStore((s) => s.hydrate);
  const resetWallet = useWalletStore((s) => s.reset);

  // No persisted user → nothing to re-validate: skip the /auth/me probe (saves a
  // guaranteed 401 round-trip on every anonymous visit) and resolve to guest.
  // Decisions wait for the persist rehydrate — the first render sees user=null even
  // for a signed-in reload, and acting on it would overwrite the stored session.
  const hasSessionHint = persistedUser !== null;

  const query = useQuery({
    queryKey: queryKeys.authMe(),
    queryFn: ({ signal }) => fetchSession(signal),
    enabled: backendEnabled && hasSessionHint, // mock mode drives the session locally
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!backendEnabled || hasSessionHint) return;
    const resolveGuest = () => {
      const s = useAuthStore.getState();
      if (s.user === null && s.status === 'unknown') setGuest();
    };
    if (useAuthStore.persist.hasHydrated()) {
      resolveGuest();
      return;
    }
    return useAuthStore.persist.onFinishHydration(resolveGuest);
  }, [hasSessionHint, setGuest]);

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
