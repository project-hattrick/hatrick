import { endpoints } from './endpoints';
import { api } from './http';

/** Mirror of the api UserResponseDto (front is its own app — no cross-app import). */
export interface AuthUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  balance: string;
  username: string | null;
  country: string | null;
  bio: string | null;
  portraitSrc: string | null;
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
const verify = (walletAddress: string, signature: string): Promise<AuthSession> =>
  api.post<AuthSession>(endpoints.auth.verify, { walletAddress, signature });

/** Validate the session cookie and hydrate the current user (used on boot). */
const me = (signal?: AbortSignal): Promise<AuthUser> =>
  api.get<AuthUser>(endpoints.auth.me, signal);

/** End the session — clears the httpOnly cookie server-side. */
const logout = (): Promise<void> => api.post<void>(endpoints.auth.logout);

export const authService = { requestNonce, verify, me, logout };
