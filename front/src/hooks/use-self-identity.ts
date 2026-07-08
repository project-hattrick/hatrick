'use client';

import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { selfProfile, type PlayerProfile } from '@/config/duelists.config';
import { shortAddress } from '@/lib/format';
import { DEFAULT_SELF_PORTRAIT } from '@/lib/avatar';

export interface SelfIdentity {
  /** Chosen portrait (persona path or uploaded data URL), or the default persona. */
  portraitSrc: string;
  displayName: string;
  /** Handle without a leading @. */
  handle: string;
}

/**
 * The signed-in user's display identity — their edited profile first, then the
 * session user, then wallet/defaults. Single source for every "this is you" surface
 * (navbar avatar, dropdown, duel VS side) so nothing hardcodes the mock selfProfile.
 */
export function useSelfIdentity(): SelfIdentity {
  const user = useAuthStore((s) => s.user);
  const portrait = useProfileStore((s) => s.portraitSrc);
  const name = useProfileStore((s) => s.displayName);
  const username = useProfileStore((s) => s.username);
  const wallet = user?.walletAddress ?? null;
  return {
    portraitSrc: portrait || user?.portraitSrc || DEFAULT_SELF_PORTRAIT,
    displayName: name || user?.displayName || (wallet ? shortAddress(wallet) : 'Guest'),
    handle: username ? username.replace(/^@/, '') : wallet ? shortAddress(wallet) : 'guest',
  };
}

/**
 * Self as a full PlayerProfile for the profile + duel / VS screens — real ranking
 * stats (mmr/tier/division/wins/losses/streak/presence) from the session user, with
 * `selfProfile` only as the logged-out fallback.
 */
export function useSelfProfile(): PlayerProfile {
  const user = useAuthStore((s) => s.user);
  const { displayName, portraitSrc, handle } = useSelfIdentity();
  const base: PlayerProfile = { ...selfProfile, name: displayName, username: handle, portraitSrc };
  if (!user) return base;
  return {
    ...base,
    id: user.id,
    rating: user.mmr,
    tier: user.tier,
    division: user.division ?? base.division,
    wins: user.wins,
    losses: user.losses,
    streak: user.streak ?? base.streak,
    presence: user.presence,
    country: user.country ?? base.country,
    bio: user.bio ?? base.bio,
    joinedAt: user.createdAt,
  };
}
