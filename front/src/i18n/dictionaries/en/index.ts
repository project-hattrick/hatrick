import { about } from './about';
import { common } from './common';
import { faq } from './faq';
import { home } from './home';
import { legal } from './legal';
import { pages } from './pages';

export const en = {
  about,
  common,
  faq,
  home,
  legal,
  pages,
  nav: common.nav,
  search: common.search,
  errors: common.errors,
} as const;
