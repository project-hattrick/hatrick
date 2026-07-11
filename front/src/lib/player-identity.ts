/**
 * Single licensing-safe player identity system for the whole app.
 *
 * We can't render real player names, and the TxLINE feed identifies players only by a numeric
 * PlayerId (no name). So every player-facing surface resolves identity through here:
 *  - pitch/match context → `${TEAM}-${number}` labels tied to the fixture's real team codes (ARG-9);
 *  - collectible cards → one of 11 fixed generic "variants", picked deterministically from the id.
 *
 * The same id (numeric PlayerId or string card id) always maps to the same variant/number, so a
 * given player looks consistent across sessions. Hashing mirrors the FNV-1a used by the dashboard
 * (use-dashboard-match.ts) and persona fallback (lib/persona-fallback.ts).
 */

export interface PlayerVariant {
  /** Licensing-safe display name. */
  name: string;
  /** Field position label, e.g. "ST". */
  position: string;
  /** ISO 3166-1 alpha-2 country code for the flag chip. */
  code: string;
  /** Pixel-art portrait in /public/cards. */
  portraitSrc: string;
}

const P93 = '/cards/player-93.png';
const PGREEN = '/cards/player-green.png';
const PKEEPER = '/cards/player-keeper.png';

/** Our 11 player variants — the fixed, generic roster every id resolves to (a 4-3-3 spread). */
export const PLAYER_VARIANTS: PlayerVariant[] = [
  { name: 'V. Kovač', position: 'GK', code: 'hr', portraitSrc: PKEEPER },
  { name: 'M. Weber', position: 'DF', code: 'de', portraitSrc: P93 },
  { name: 'A. Rossi', position: 'DF', code: 'it', portraitSrc: PGREEN },
  { name: 'D. Andersen', position: 'DF', code: 'dk', portraitSrc: P93 },
  { name: 'H. Yılmaz', position: 'DF', code: 'tr', portraitSrc: PGREEN },
  { name: 'T. Okafor', position: 'MF', code: 'ng', portraitSrc: P93 },
  { name: 'L. Moreau', position: 'MF', code: 'fr', portraitSrc: PGREEN },
  { name: 'S. Petrov', position: 'MF', code: 'bg', portraitSrc: P93 },
  { name: 'J. Navarro', position: 'FW', code: 'es', portraitSrc: PGREEN },
  { name: 'R. Duarte', position: 'FW', code: 'br', portraitSrc: P93 },
  { name: 'K. Mensah', position: 'FW', code: 'gh', portraitSrc: PGREEN },
];

export const VARIANT_COUNT = PLAYER_VARIANTS.length;

/** FNV-1a over the stringified id — stable, cheap, and dependency-free. */
function hashId(id: string | number): number {
  const str = String(id);
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic variant index (0..VARIANT_COUNT-1) for any player/card id. */
export function variantForId(id: string | number): number {
  return hashId(id) % VARIANT_COUNT;
}

/** The variant a player/card id resolves to — stable across sessions. */
export function variantFor(id: string | number): PlayerVariant {
  return PLAYER_VARIANTS[variantForId(id)];
}

/** Team-scoped pitch label, e.g. teamPlayerLabel('ARG', 9) → "ARG-9". */
export function teamPlayerLabel(teamCode: string, shirt: number): string {
  return `${(teamCode || '??').toUpperCase()}-${shirt}`;
}

/** Deterministic shirt number (1..11) for a feed event/card that carries none. */
export function numberForId(id: string | number): number {
  return (hashId(id) % 11) + 1;
}
