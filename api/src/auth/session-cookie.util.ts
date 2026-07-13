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
 * SameSite for the session cookie. Defaults to `lax` (front + api same-site on localhost).
 * When the front (Vercel) and api (Fly/Render) live on **different registrable domains** the
 * request is cross-site, so the browser drops a `Lax` cookie on fetch/XHR and auth silently
 * breaks in prod. Set `SESSION_COOKIE_SAMESITE=none` for that split deployment. `None` is only
 * honoured by browsers over HTTPS, so it forces `Secure` on regardless of `NODE_ENV`.
 */
function resolveSameSite(): 'lax' | 'none' | 'strict' {
  const raw = (process.env.SESSION_COOKIE_SAMESITE ?? 'lax').trim().toLowerCase();
  return raw === 'none' || raw === 'strict' ? raw : 'lax';
}

/**
 * Cookie options for the session — httpOnly (no JS access → XSS-safe), SameSite driven by
 * `SESSION_COOKIE_SAMESITE` (lax locally, none for split-domain prod), Secure in prod or
 * whenever SameSite=None. Optional `SESSION_COOKIE_DOMAIN` scopes the cookie (leave unset for
 * host-only). `maxAge` mirrors JWT_EXPIRES_IN so the cookie and token expire together.
 * Centralized so `verify` (set) and `logout` (clear) stay in lockstep.
 */
export function sessionCookieOptions(): CookieOptions {
  const sameSite = resolveSameSite();
  const domain = process.env.SESSION_COOKIE_DOMAIN?.trim() || undefined;
  return {
    httpOnly: true,
    sameSite,
    // SameSite=None is rejected by browsers without Secure; force it on in that case.
    secure: sameSite === 'none' || process.env.NODE_ENV === 'production',
    domain,
    path: '/',
    maxAge: durationToMs(process.env.JWT_EXPIRES_IN, 7 * 86_400_000),
  };
}

/**
 * Options for clearing the session cookie. A browser only removes a cookie when the clear
 * matches the original `domain`/`path`/`sameSite`/`secure` attributes — so mirror them here,
 * dropping only `maxAge` (clearCookie sets an expired date itself).
 */
export function clearSessionCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...rest } = sessionCookieOptions();
  return rest;
}
