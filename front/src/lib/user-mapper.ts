import { RankTier } from '@/enums/rank-tier.enum';
import { Presence } from '@/enums/presence.enum';
import { shortAddress } from '@/lib/format';
import { DEFAULT_SELF_PORTRAIT } from '@/lib/avatar';
import type { AuthUser } from '@/services/auth.service';
import type { PlayerProfile } from '@/config/duelists.config';

/** Raw api `UserResponseDto` — enums are PascalCase strings, dates are ISO strings. */
export interface ApiUserDto {
  id: string;
  walletAddress: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
  portraitSrc: string | null;
  role: string;
  status: string;
  mmr: number;
  tier: string;
  division: string | null;
  wins: number;
  losses: number;
  streak: string | null;
  presence: string;
  balance: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Api enum keys are PascalCase (e.g. "Gold"); front enum keys match → value lookup. */
const toRankTier = (t: string): RankTier => RankTier[t as keyof typeof RankTier] ?? RankTier.Bronze;
const toPresence = (p: string): Presence => Presence[p as keyof typeof Presence] ?? Presence.Offline;

/** Api user → session `AuthUser` (front enums, stats carried through). */
export const toAuthUser = (u: ApiUserDto): AuthUser => ({
  id: u.id,
  walletAddress: u.walletAddress,
  displayName: u.displayName,
  balance: u.balance,
  username: u.username,
  country: u.country,
  bio: u.bio,
  portraitSrc: u.portraitSrc,
  createdAt: u.createdAt,
  mmr: u.mmr,
  tier: toRankTier(u.tier),
  division: u.division,
  wins: u.wins,
  losses: u.losses,
  streak: u.streak,
  presence: toPresence(u.presence),
});

/** Api user → front `PlayerProfile` (directory, public profile, VS screens). */
export const toPlayerProfile = (u: ApiUserDto): PlayerProfile => ({
  id: u.id,
  username: u.username ?? shortAddress(u.walletAddress),
  name: u.displayName ?? u.username ?? shortAddress(u.walletAddress),
  country: u.country ?? 'BRA',
  tier: toRankTier(u.tier),
  division: u.division ?? 'III',
  rating: u.mmr,
  wins: u.wins,
  losses: u.losses,
  streak: u.streak ?? 'W0',
  portraitSrc: u.portraitSrc ?? DEFAULT_SELF_PORTRAIT,
  presence: toPresence(u.presence),
  bio: u.bio ?? '',
  joinedAt: u.createdAt,
});
