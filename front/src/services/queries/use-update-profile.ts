'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileService, type ProfilePatch } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { queryKeys } from './keys';

/** Data URLs are big and would bloat every /auth/me — kept local, never PATCHed. */
const isUploadedPhoto = (src: string): boolean => src.startsWith('data:');

/** Drop empty strings so "" doesn't overwrite a field; skip uploaded-photo portraits. */
function toServerPatch(patch: ProfilePatch): ProfilePatch {
  const out: ProfilePatch = {};
  for (const [key, value] of Object.entries(patch) as [keyof ProfilePatch, string | undefined][]) {
    if (!value) continue;
    if (key === 'portraitSrc' && isUploadedPhoto(value)) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Persist profile edits to the api (PATCH /users/:id) for the signed-in user, then
 * reconcile both stores from the authoritative response. Throws if not signed in —
 * callers gate on auth (the edit form only PATCHes when authenticated).
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const hydrateFromServer = useProfileStore((s) => s.hydrateFromServer);

  return useMutation({
    mutationFn: (patch: ProfilePatch) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Sign in to save your profile');
      return profileService.update(userId, toServerPatch(patch));
    },
    onSuccess: (user) => {
      setSession(user); // refresh cached user (displayName/etc.)
      hydrateFromServer(user);
      queryClient.setQueryData(queryKeys.authMe(), user);
    },
  });
}
