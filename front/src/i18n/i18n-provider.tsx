'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getDictionary, type Dictionary } from './get-dictionary';
import { DEFAULT_LOCALE, type Locale } from './locales';

interface I18nContextValue {
  locale: Locale;
  dictionary: Dictionary;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  dictionary: getDictionary(DEFAULT_LOCALE),
});

export function I18nProvider({
  children,
  locale,
  dictionary,
}: {
  children: ReactNode;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const value = useMemo(() => ({ locale, dictionary }), [dictionary, locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

type DotPath<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPath<T[K]>}`;
}[keyof T & string];

export function useT() {
  const { dictionary } = useI18n();

  return (key: DotPath<Dictionary>, values?: Record<string, string | number>) => {
    const value = key.split('.').reduce<unknown>((current, part) => {
      if (current && typeof current === 'object' && part in current) {
        return (current as Record<string, unknown>)[part];
      }
      return undefined;
    }, dictionary);

    if (typeof value !== 'string') return key;
    if (!values) return value;

    return Object.entries(values).reduce(
      (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
      value,
    );
  };
}
