'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getDictionary, type Dictionary } from './get-dictionary';
import { DEFAULT_LOCALE, type Locale } from './locales';
import { translate, type DotPath, type TranslationValues } from './translate';

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

export function useT() {
  const { dictionary } = useI18n();

  return (key: DotPath<Dictionary>, values?: TranslationValues) => translate(dictionary, key, values);
}
