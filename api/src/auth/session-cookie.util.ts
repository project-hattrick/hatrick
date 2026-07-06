import type { CookieOptions } from 'express';

/** Name of the httpOnly session cookie carrying the JWT. */
export const SESSION_COOKIE = 'ht_session';

/** Parse an ms-style duration ("7d", "12h", "30m", "45s") or bare seconds → milliseconds. */
function durationToMs(value: string | undefined, fallbackMs: number): number {
  if (!value) return fallbackMs;
  const match = /^(\d+)\s*([dhms])?$/.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unitMs: Record<string, number> = {
    d: 86_400_000,
    h: 3_600_000,
    m: 60_000,
    s: 1_000,
  };
  return amount * (unitMs[match[2] ?? 's'] ?? 1_000);
}

/**
 * Cookie options for the session — httpOnly (no JS access → XSS-safe), SameSite=Lax
 * (front and api are same-site on localhost, so no cross-site leakage), Secure in prod.
 * `maxAge` mirrors JWT_EXPIRES_IN so the cookie and token expire together.
 * Centralized so `verify` (set) and `logout` (clear) stay in lockstep.
 */
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: durationToMs(process.env.JWT_EXPIRES_IN, 7 * 86_400_000),
  };
}
