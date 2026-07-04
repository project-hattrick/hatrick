import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Editable profile fields (empty string = not set; readers fall back to wallet/session values). */
export interface ProfileDraft {
  displayName: string;
  username: string;
  country: string;
  bio: string;
}

interface ProfileStore extends ProfileDraft {
  save: (draft: ProfileDraft) => void;
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
      save: (draft) => set(draft),
    }),
    {
      name: 'hat-trick-profile',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);
