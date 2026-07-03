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
  [Theme.Onyx]: { label: 'Onyx', accent: '#aef019', surface: '#080a0f' },
  [Theme.Midnight]: { label: 'Midnight', accent: '#aef019', surface: '#12182c' },
  [Theme.Carbon]: { label: 'Carbon', accent: '#aef019', surface: '#0c0a09' },
  [Theme.Espresso]: { label: 'Espresso', accent: '#aef019', surface: '#1f1812' },
  [Theme.Slate]: { label: 'Slate', accent: '#aef019', surface: '#101216' },
  [Theme.Graphite]: { label: 'Graphite', accent: '#aef019', surface: '#1f2024' },
  [Theme.Ash]: { label: 'Ash', accent: '#aef019', surface: '#23201c' },
  [Theme.MonoLive]: { label: 'Mono Live', accent: '#f4f4f5', surface: '#0a0a0b' },
};

export const themeOrder: Theme[] = [
  Theme.NeonTurf,
  Theme.Obsidian,
  Theme.Onyx,
  Theme.Midnight,
  Theme.Carbon,
  Theme.Espresso,
  Theme.Slate,
  Theme.Graphite,
  Theme.Ash,
  Theme.MonoLive,
];
