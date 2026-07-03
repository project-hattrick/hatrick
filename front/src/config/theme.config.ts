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
  [Theme.Obsidian]: { label: 'Obsidian', accent: '#aef019', surface: '#000000' },
  [Theme.Void]: { label: 'Void', accent: '#aef019', surface: '#050506' },
  [Theme.Ink]: { label: 'Ink', accent: '#aef019', surface: '#0b0e16' },
  [Theme.Sable]: { label: 'Sable', accent: '#aef019', surface: '#120f0a' },
  [Theme.Jet]: { label: 'Jet', accent: '#aef019', surface: '#131316' },
  [Theme.Onyx]: { label: 'Onyx', accent: '#aef019', surface: '#080a0f' },
  [Theme.Abyss]: { label: 'Abyss', accent: '#aef019', surface: '#0f1c1f' },
  [Theme.Midnight]: { label: 'Midnight', accent: '#aef019', surface: '#12182c' },
  [Theme.Carbon]: { label: 'Carbon', accent: '#aef019', surface: '#0c0a09' },
  [Theme.Espresso]: { label: 'Espresso', accent: '#aef019', surface: '#1f1812' },
  [Theme.Slate]: { label: 'Slate', accent: '#aef019', surface: '#101216' },
  [Theme.Graphite]: { label: 'Graphite', accent: '#aef019', surface: '#1f2024' },
  [Theme.Ash]: { label: 'Ash', accent: '#aef019', surface: '#23201c' },
  [Theme.Fog]: { label: 'Fog', accent: '#aef019', surface: '#242932' },
  [Theme.Stone]: { label: 'Stone', accent: '#aef019', surface: '#24211d' },
  [Theme.Mist]: { label: 'Mist', accent: '#aef019', surface: '#2a2e36' },
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
  { label: 'Pure black', themes: [Theme.Obsidian, Theme.Void, Theme.Ink, Theme.Sable, Theme.Jet] },
  { label: 'Deep', themes: [Theme.NeonTurf, Theme.Onyx, Theme.Abyss, Theme.Midnight, Theme.Carbon, Theme.Espresso] },
  { label: 'Soft', themes: [Theme.Slate, Theme.Graphite, Theme.Ash, Theme.Fog, Theme.Stone, Theme.Mist] },
  { label: 'Accent', themes: [Theme.MonoLive, Theme.Platinum, Theme.Bronze] },
];

/** Flat order (derived from the categories) — the single source of truth for any list usage. */
export const themeOrder: Theme[] = themeCategories.flatMap((c) => c.themes);
