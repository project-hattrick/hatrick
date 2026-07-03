/** Selectable home palette — all dark, differing in black tone (accent stays constant). */
export enum Theme {
  NeonTurf = 'neon-turf',
  Obsidian = 'obsidian',
  Onyx = 'onyx',
  Midnight = 'midnight',
  Carbon = 'carbon',
  Espresso = 'espresso',
  Slate = 'slate',
  Graphite = 'graphite',
  Ash = 'ash',
  MonoLive = 'mono-live',
}

/** Baseline palette — rendered by the default `.dark` block (no `data-theme` attribute). */
export const DEFAULT_THEME = Theme.NeonTurf;

const THEME_VALUES = new Set<string>(Object.values(Theme));

/** Narrow an untrusted string (e.g. the `?theme=` query param) to a Theme, or null. */
export function parseTheme(value: string | null | undefined): Theme | null {
  return value && THEME_VALUES.has(value) ? (value as Theme) : null;
}
