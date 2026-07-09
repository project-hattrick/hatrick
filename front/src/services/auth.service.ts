import { AccountType } from '@/enums/account-type.enum';
import { RankTier } from '@/enums/rank-tier.enum';
import { Presence } from '@/enums/presence.enum';
import { toAuthUser, type ApiUserDto } from '@/lib/user-mapper';
import { endpoints } from './endpoints';
import { api } from './http';

/** Mirror of the api UserResponseDto (front is its own app — no cross-app import). */
export interface AuthUser {
  id: string;
  walletAddress: string;
  /** Login tier — Competitor (wallet) vs Collector (casual email/Google). */
  accountType: AccountType;
  displayName: string | null;
  balance: string;
  username: string | null;
  country: string | null;
  bio: string | null;
  portraitSrc: string | null;
  /** Account creation ISO date (drives the "Joined" line). */
  createdAt: string;
  /** Ranking stats (denormalized server-side, recomputed each duel settle). */
  mmr: number;
  tier: RankTier;
  division: string | null;
  wins: number;
  losses: number;
  streak: string | null;
  presence: Presence;
}

interface NonceResponse {
  nonce: string;
  message: string;
}

export interface AuthSession {
  /** The JWT also comes back in the body for non-browser clients; the browser uses the cookie. */
  token: string;
  user: AuthUser;
  /** True when this sign-in created the account (first registration) — drives onboarding. */
  isNew: boolean;
}

/** Step 1: ask the api for a one-time message to sign. */
const requestNonce = (walletAddress: string): Promise<NonceResponse> =>
  api.post<NonceResponse>(endpoints.auth.nonce, { walletAddress });

/** Step 2: submit the signed message; the api sets the httpOnly session cookie. */
const verify = async (walletAddress: string, signature: string): Promise<AuthSession> => {
  const res = await api.post<{ token: string; user: ApiUserDto; isNew: boolean }>(
    endpoints.auth.verify,
    { walletAddress, signature },
  );
  return { token: res.token, user: toAuthUser(res.user), isNew: res.isNew };
};

/** Validate the session cookie and hydrate the current user (used on boot). */
const me = async (signal?: AbortSignal): Promise<AuthUser> =>
  toAuthUser(await api.get<ApiUserDto>(endpoints.auth.me, signal));

/** End the session — clears the httpOnly cookie server-side. */
const logout = (): Promise<void> => api.post<void>(endpoints.auth.logout);

export const authService = { requestNonce, verify, me, logout };
