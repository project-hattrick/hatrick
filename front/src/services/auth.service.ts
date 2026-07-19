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
  /** Login tier — Competitor (wallet/Privy) vs Collector (email). */
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

/** Backend wrapper for login/session routes (POST /auth/login, GET /auth/session). */
interface SessionResponse {
  user: ApiUserDto;
  hasDelegation: boolean;
  delegationExpiresAt: string | null;
}

/** Backend wrapper for the email-only route (POST /auth/email). */
interface EmailResponse {
  user: ApiUserDto;
  token?: string;
  isNew?: boolean;
}

/**
 * Exchange a Privy access token for a backend session cookie.
 * POST /auth/login { privyToken } → sets httpOnly cookie.
 */
const login = async (privyToken: string): Promise<AuthUser> => {
  const res = await api.post<SessionResponse>(endpoints.auth.login, { privyToken });
  return toAuthUser(res.user);
};

/**
 * Email sign-in-or-register (Collector tier).
 * POST /auth/email { email, password } → sets httpOnly cookie.
 */
const signInWithEmail = async (email: string, password: string): Promise<{ user: AuthUser; isNew: boolean }> => {
  const res = await api.post<EmailResponse>(endpoints.auth.email, { email, password });
  return { user: toAuthUser(res.user), isNew: res.isNew ?? false };
};

/**
 * Validate the session cookie and hydrate the current user (used on boot).
 * GET /auth/session → throws ApiError 401 when the cookie is absent/expired.
 */
const session = async (signal?: AbortSignal): Promise<AuthUser> => {
  const res = await api.get<SessionResponse>(endpoints.auth.session, signal);
  return toAuthUser(res.user);
};

/**
 * @deprecated Use `authService.session()` instead. Kept as a shim for existing callers
 * while the migration is in progress (use-session.ts still calls `me` in some paths).
 */
const me = (signal?: AbortSignal): Promise<AuthUser> => session(signal);

/** End the session — clears the httpOnly cookie server-side. */
const logout = (): Promise<void> => api.post<void>(endpoints.auth.logout);

/**
 * Delegation status — project/api has no delegation endpoints, so this is a stub
 * that always reports false. hasDelegation from the session payload is ignored here.
 */
const delegationStatus = async (_signal?: AbortSignal): Promise<boolean> => false;

export const authService = {
  login,
  signInWithEmail,
  session,
  me,
  logout,
  delegationStatus,
};
