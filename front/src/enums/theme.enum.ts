/** Selectable home palette — all dark, differing in black tone (accent stays constant). */
export enum Theme {
  NeonTurf = 'neon-turf',
  Void = 'void',
  Onyx = 'onyx',
  MonoLive = 'mono-live',
  Platinum = 'platinum',
  Bronze = 'bronze',
}

/** Default palette applied on load (each theme is applied as its own `data-theme`).
 *  `neon-turf` has no override block — it falls through to the baseline `.dark`/`@theme` identity. */
export const DEFAULT_THEME = Theme.NeonTurf;

const THEME_VALUES = new Set<string>(Object.values(Theme));

/** Narrow an untrusted string (e.g. the `?theme=` query param) to a Theme, or null. */
export function parseTheme(value: string | null | undefined): Theme | null {
  return value && THEME_VALUES.has(value) ? (value as Theme) : null;
}
