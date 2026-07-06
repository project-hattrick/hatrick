import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Editable profile fields (empty string = not set; readers fall back to wallet/session values). */
export interface ProfileDraft {
  displayName: string;
  username: string;
  country: string;
  bio: string;
  /** `/personas/*` preset path, an uploaded `data:` URL, or empty = default portrait. */
  portraitSrc: string;
}

/** Subset of the authed user carrying the server-persisted profile fields. */
export interface ServerProfile {
  displayName: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
  portraitSrc: string | null;
}

interface ProfileStore extends ProfileDraft {
  save: (draft: ProfileDraft) => void;
  /** Reconcile with the authoritative server profile (from /auth/me or a save). */
  hydrateFromServer: (user: ServerProfile) => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Locally-persisted profile customizations (display name, handle, country, bio) edited inline on
 * /profile. The api session only carries walletAddress/displayName, so this store is the source
 * of truth the UI prefers — same persistence pattern as auth.store.
 */
export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      displayName: '',
      username: '',
      country: '',
      bio: '',
      portraitSrc: '',
      save: (draft) => set(draft),
      hydrateFromServer: (user) =>
        set((prev) => ({
          // Server is the source of truth; fall back to whatever's local when a
          // field is unset server-side (e.g. an uploaded data-URL portrait we keep
          // local, or a guest's edits before their first save).
          displayName: user.displayName ?? prev.displayName,
          username: user.username ?? prev.username,
          country: user.country ?? prev.country,
          bio: user.bio ?? prev.bio,
          portraitSrc: user.portraitSrc ?? prev.portraitSrc,
        })),
    }),
    {
      name: 'hat-trick-profile',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);
