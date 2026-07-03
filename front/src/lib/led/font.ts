/**
 * Tiny 5-row dot-matrix font (uppercase + digits + a few symbols), authored as pixel rows.
 * Each glyph is an array of 5 strings of '1' (lit) / '0' (dark); width = row length (variable per glyph).
 * Shared by the in-game LED billboards and the `<LightBoard>` component — framework-free, no DOM.
 */
export const LED_ROWS = 5;

export const LED_FONT: Record<string, string[]> = {
  ' ': ['00', '00', '00', '00', '00'],
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['10001', '11011', '10101', '10001', '10001'],
  N: ['1001', '1101', '1011', '1001', '1001'],
  O: ['111', '101', '101', '101', '111'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '111', '011'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['10001', '10001', '10101', '11011', '10001'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['110', '001', '010', '100', '111'],
  '3': ['110', '001', '010', '001', '110'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '110', '001', '110'],
  '6': ['011', '100', '110', '101', '010'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['010', '101', '010', '101', '010'],
  '9': ['010', '101', '011', '001', '110'],
  '-': ['000', '000', '111', '000', '000'],
  '.': ['0', '0', '0', '0', '1'],
  '!': ['1', '1', '1', '0', '1'],
  ':': ['0', '1', '0', '1', '0'],
  '/': ['001', '001', '010', '100', '100'],
  '&': ['010', '101', '010', '101', '011'],
  "'": ['1', '1', '0', '0', '0'],
};

/** Glyph used for any character not in the font. */
const FALLBACK = LED_FONT[' '];

/**
 * Expands a string into a column-major bit grid, vertically centered in `rows`.
 * Returns `cols[c][r]` = true when the dot at column `c`, row `r` is lit.
 * A trailing spacer column is appended between glyphs (and looped by the caller).
 */
export function textToColumns(text: string, rows: number, letterGap = 1): boolean[][] {
  const topPad = Math.max(0, Math.floor((rows - LED_ROWS) / 2));
  const cols: boolean[][] = [];
  const chars = text.toUpperCase().split('');

  chars.forEach((ch, i) => {
    const glyph = LED_FONT[ch] ?? FALLBACK;
    const width = glyph[0].length;
    for (let c = 0; c < width; c++) {
      const col = new Array<boolean>(rows).fill(false);
      for (let r = 0; r < LED_ROWS; r++) col[topPad + r] = glyph[r][c] === '1';
      cols.push(col);
    }
    if (i < chars.length - 1) {
      for (let g = 0; g < letterGap; g++) cols.push(new Array<boolean>(rows).fill(false));
    }
  });

  return cols;
}
