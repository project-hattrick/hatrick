/**
 * Geo-compliance for betting surfaces. Sports-event derivatives are restricted in some jurisdictions
 * (e.g. Brazil — CMN Res. 5.298/2026), so we block those visitors on odds/bet-slip/settlement surfaces.
 * Enforcement lives in `src/proxy.ts` (the edge middleware); country comes from the edge geo headers.
 */

/** ISO-3166 alpha-2 codes where betting surfaces are blocked. */
export enum RestrictedCountry {
  Brazil = 'BR',
}

const RESTRICTED = new Set<string>(Object.values(RestrictedCountry));

/** Locale-stripped path prefixes that expose betting (live odds, bet slip, fixtures + settlement). */
export const BETTING_SURFACES = ['/live', '/bets', '/fixtures'] as const;

/** Where blocked visitors land — a static interstitial explaining the restriction. */
export const GEO_RESTRICTED_PATH = '/legal/geo-restricted';

/** Query flag + cookie that let judges bypass the block during the demo. */
export const GEO_BYPASS_PARAM = 'geo';
export const GEO_BYPASS_VALUE = 'demo';
export const GEO_BYPASS_COOKIE = 'ht_geo_bypass';

/** True when the resolved country is on the block list. Unknown (local dev) never blocks. */
export function isRestrictedCountry(code: string | null | undefined): boolean {
  return Boolean(code) && RESTRICTED.has((code as string).toUpperCase());
}

/** True when a locale-stripped path is a betting surface (exact or nested). */
export function isBettingSurface(strippedPath: string): boolean {
  return BETTING_SURFACES.some((prefix) => strippedPath === prefix || strippedPath.startsWith(`${prefix}/`));
}
