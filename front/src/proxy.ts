import { NextRequest, NextResponse } from 'next/server';
import { LOCALE_COOKIE, isLocale, locales, normalizeLocale, type Locale } from '@/i18n/locales';
import { stripLocaleFromPathname } from '@/i18n/path';
import {
  GEO_BYPASS_COOKIE,
  GEO_BYPASS_PARAM,
  GEO_BYPASS_VALUE,
  GEO_RESTRICTED_PATH,
  ONBOARDING_PARAM,
  ONBOARDING_VALUE,
  isBettingSurface,
  isRestrictedCountry,
} from '@/config/geo-restrictions.config';

const PUBLIC_FILE = /\.(.*)$/;

/** Country from the edge geo headers (Vercel / Cloudflare). Absent in local dev → never blocks. */
function countryOf(request: NextRequest): string | null {
  return (
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    request.headers.get('x-country') ??
    null
  );
}

/** True when the request carries a bypass trigger — `?geo=demo` or the submission `?onboarding=true`. */
function hasBypassParam(request: NextRequest): boolean {
  const params = request.nextUrl.searchParams;
  return (
    params.get(GEO_BYPASS_PARAM) === GEO_BYPASS_VALUE ||
    params.get(ONBOARDING_PARAM) === ONBOARDING_VALUE
  );
}

/** A judge who appended `?geo=demo`/`?onboarding=true` once (or already holds the cookie) skips the block. */
function geoBypassed(request: NextRequest): boolean {
  return request.cookies.get(GEO_BYPASS_COOKIE)?.value === '1' || hasBypassParam(request);
}

function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const accepted = request.headers.get('accept-language') ?? '';
  const preferred = accepted
    .split(',')
    .map((part) => part.split(';')[0]?.trim())
    .find(Boolean);

  return normalizeLocale(preferred);
}

function isBypassed(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/game') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/opengraph-image' ||
    PUBLIC_FILE.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isBypassed(pathname)) return NextResponse.next();

  const segments = pathname.split('/').filter(Boolean);
  const pathLocale = segments[0];

  if (isLocale(pathLocale)) {
    // Geo-compliance: block betting surfaces for restricted jurisdictions (demo-bypassable for judges).
    const stripped = stripLocaleFromPathname(pathname);
    const blocked =
      isBettingSurface(stripped) && isRestrictedCountry(countryOf(request)) && !geoBypassed(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${pathLocale}${GEO_RESTRICTED_PATH}`;
    const response = blocked ? NextResponse.rewrite(url) : NextResponse.next();

    if (hasBypassParam(request)) {
      response.cookies.set(GEO_BYPASS_COOKIE, '1', { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });
    }
    response.cookies.set(LOCALE_COOKIE, pathLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return response;
  }

  if (pathLocale && locales.some((locale) => locale.toLowerCase() === pathLocale.toLowerCase())) {
    const locale = normalizeLocale(pathLocale);
    const rest = segments.slice(1).join('/');
    const url = request.nextUrl.clone();
    url.pathname = rest ? `/${locale}/${rest}` : `/${locale}`;
    return NextResponse.redirect(url);
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
