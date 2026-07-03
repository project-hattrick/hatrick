/** Selectable home palette. Values are the `data-theme` attribute written on <html>. */
export enum Theme {
  NeonTurf = 'neon-turf',
  BroadcastNight = 'broadcast-night',
  GrassClassic = 'grass-classic',
  SunsetKickoff = 'sunset-kickoff',
  MonoLive = 'mono-live',
}

/** Baseline palette — rendered by the default `.dark` block (no `data-theme` attribute). */
export const DEFAULT_THEME = Theme.NeonTurf;

const THEME_VALUES = new Set<string>(Object.values(Theme));

/** Narrow an untrusted string (e.g. the `?theme=` query param) to a Theme, or null. */
export function parseTheme(value: string | null | undefined): Theme | null {
  return value && THEME_VALUES.has(value) ? (value as Theme) : null;
}
