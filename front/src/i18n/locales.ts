export const DEFAULT_LOCALE = 'en';
export const LOCALE_COOKIE = 'hat-trick-locale';

export const locales = ['en', 'pt-BR'] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, { label: string; shortLabel: string; flag: string; ogLocale: string }> = {
  en: { label: 'English', shortLabel: 'EN', flag: 'us', ogLocale: 'en_US' },
  'pt-BR': { label: 'Portuguese', shortLabel: 'PT', flag: 'br', ogLocale: 'pt_BR' },
};

export function isLocale(value: string | undefined): value is Locale {
  return locales.some((locale) => locale === value);
}

export function normalizeLocale(value: string | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  if (normalized === 'pt' || normalized === 'pt-br') return 'pt-BR';
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  return DEFAULT_LOCALE;
}
