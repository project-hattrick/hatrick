import type { Dictionary } from './get-dictionary';

export type TranslationValues = Record<string, string | number>;

type JoinPath<Prefix extends string, Key extends string> = Prefix extends '' ? Key : `${Prefix}.${Key}`;

export type DotPath<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : T extends readonly unknown[]
    ? never
    : {
        [K in keyof T & string]: T[K] extends string
          ? JoinPath<Prefix, K>
          : DotPath<T[K], JoinPath<Prefix, K>>;
      }[keyof T & string];

export function translate(
  dictionary: Dictionary,
  key: DotPath<Dictionary>,
  values?: TranslationValues,
) {
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
}
