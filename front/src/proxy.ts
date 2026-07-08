import { NextRequest, NextResponse } from 'next/server';
import { LOCALE_COOKIE, isLocale, locales, normalizeLocale, type Locale } from '@/i18n/locales';

const PUBLIC_FILE = /\.(.*)$/;

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
    const response = NextResponse.next();
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
