import { en } from './dictionaries/en';
import { ptBR } from './dictionaries/pt-BR';
import { DEFAULT_LOCALE, type Locale } from './locales';

type DictionaryShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DictionaryShape<T[K]>;
};

export type Dictionary = DictionaryShape<typeof en>;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  'pt-BR': ptBR,
};

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
