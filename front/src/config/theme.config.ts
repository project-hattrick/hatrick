import { Theme } from '@/enums/theme.enum';

/** Display metadata for the theme switcher — keeps enum→UI mapping out of components. */
export interface ThemeMeta {
  label: string;
  /** Accent (neon) swatch shown in the switcher. */
  accent: string;
  /** Background swatch behind the accent dot. */
  surface: string;
}

export const themeConfig: Record<Theme, ThemeMeta> = {
  [Theme.NeonTurf]: { label: 'Neon Turf', accent: '#aef019', surface: '#141519' },
  [Theme.BroadcastNight]: { label: 'Broadcast Night', accent: '#22d3ee', surface: '#111629' },
  [Theme.GrassClassic]: { label: 'Grass Classic', accent: '#35d06a', surface: '#0d1a12' },
  [Theme.SunsetKickoff]: { label: 'Sunset Kickoff', accent: '#ff9e2c', surface: '#1c1512' },
  [Theme.MonoLive]: { label: 'Mono Live', accent: '#f4f4f5', surface: '#121213' },
};

export const themeOrder: Theme[] = [
  Theme.NeonTurf,
  Theme.BroadcastNight,
  Theme.GrassClassic,
  Theme.SunsetKickoff,
  Theme.MonoLive,
];
