import type { en } from '../en';
import { about } from './about';
import { common } from './common';
import { faq } from './faq';
import { home } from './home';
import { legal } from './legal';
import { pages } from './pages';

type DictionaryShape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DictionaryShape<U>[]
    : { readonly [K in keyof T]: DictionaryShape<T[K]> };

export const ru: DictionaryShape<typeof en> = {
  about,
  common,
  faq,
  home,
  legal,
  pages,
  nav: common.nav,
  search: common.search,
  errors: common.errors,
};
