import { env } from '@/lib/env';

/** Mirror of the api UserResponseDto (front is its own app — no cross-app import). */
export interface AuthUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  balance: string;
}

interface NonceResponse {
  nonce: string;
  message: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  /** True when this sign-in created the account (first registration) — drives onboarding. */
  isNew: boolean;
}

/** Step 1: ask the api for a one-time message to sign. */
async function requestNonce(walletAddress: string): Promise<NonceResponse> {
  const res = await fetch(`${env.apiUrl}/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) throw new Error(`Failed to request nonce (${res.status})`);
  return res.json() as Promise<NonceResponse>;
}

/** Step 2: submit the signed message; get back a session JWT + user. */
async function verify(
  walletAddress: string,
  signature: string,
): Promise<AuthSession> {
  const res = await fetch(`${env.apiUrl}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, signature }),
  });
  if (!res.ok) throw new Error(`Signature verification failed (${res.status})`);
  return res.json() as Promise<AuthSession>;
}

export const authService = { requestNonce, verify };
