'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/i18n-provider';
import { localizePath } from '@/i18n/path';
import type { Locale } from '@/i18n/locales';

export function useLocalizedPath() {
  const { locale } = useI18n();
  return (path: string) => localizePath(path, locale);
}

export function useLocalizedRouter() {
  const router = useRouter();
  const localizedPath = useLocalizedPath();

  return {
    push: (path: string) => router.push(localizedPath(path)),
    replace: (path: string) => router.replace(localizedPath(path)),
  };
}

export function useCurrentLocalePath(locale: Locale) {
  const pathname = usePathname();
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const hash = typeof window === 'undefined' ? '' : window.location.hash;
  return localizePath(pathname + search + hash, locale);
}
