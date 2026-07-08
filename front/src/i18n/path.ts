import { DEFAULT_LOCALE, isLocale, type Locale } from './locales';

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split('/').filter(Boolean)[0];
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}

export function stripLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (isLocale(segments[0])) segments.shift();
  return segments.length ? `/${segments.join('/')}` : '/';
}

export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith('/')) return path;
  const [pathname, suffix = ''] = path.split(/(?=[?#])/);
  const stripped = stripLocaleFromPathname(pathname);
  return stripped === '/' ? `/${locale}${suffix}` : `/${locale}${stripped}${suffix}`;
}
