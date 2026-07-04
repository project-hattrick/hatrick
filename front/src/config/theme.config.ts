import { Theme } from '@/enums/theme.enum';

/** Display metadata for the theme switcher — keeps enum→UI mapping out of components. */
export interface ThemeMeta {
  label: string;
  /** Accent (neon) swatch shown ringed inside the surface dot. */
  accent: string;
  /** Background/surface swatch — the black tone that actually distinguishes each theme. */
  surface: string;
}

export const themeConfig: Record<Theme, ThemeMeta> = {
  [Theme.NeonTurf]: { label: 'Neon Turf', accent: '#aef019', surface: '#0b0c0f' },
  [Theme.Void]: { label: 'Void', accent: '#aef019', surface: '#050506' },
  [Theme.Onyx]: { label: 'Onyx', accent: '#aef019', surface: '#080a0f' },
  [Theme.MonoLive]: { label: 'Mono Live', accent: '#f4f4f5', surface: '#0a0a0b' },
  [Theme.Platinum]: { label: 'Platinum', accent: '#c9ced8', surface: '#181b20' },
  [Theme.Bronze]: { label: 'Bronze', accent: '#cba15c', surface: '#1d1912' },
};

/** Themes grouped by black-tone family, for the categorized switcher. */
export interface ThemeCategory {
  label: string;
  themes: Theme[];
}

export const themeCategories: ThemeCategory[] = [
  { label: 'Black', themes: [Theme.NeonTurf, Theme.Void, Theme.Onyx] },
  { label: 'Accent', themes: [Theme.MonoLive, Theme.Platinum, Theme.Bronze] },
];

/** Flat order (derived from the categories) — the single source of truth for any list usage. */
export const themeOrder: Theme[] = themeCategories.flatMap((c) => c.themes);
