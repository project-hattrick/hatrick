/**
 * Starting XI per team for the "Team Line Up" card. We can't render real player names and the TxLINE
 * feed carries no lineups, so each row is a licensing-safe `${CODE}-${number}` label (ARG-1 … ARG-11)
 * tied to the SELECTED match's real team code — always correct for any team, no curated-list drift.
 */

import { teamPlayerLabel } from '@/lib/player-identity';

/** Position tags down the card, one per lineup row — a 4-3-3. */
export const LINEUP_POSITIONS = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'] as const;

export interface LineupPlayer {
  pos: string;
  name: string;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The starting XI (11 rows, 4-3-3) for a team code — CODE-1 (GK) … CODE-11, shirt numbers by row. */
export function lineupFor(code: string): LineupPlayer[] {
  return LINEUP_POSITIONS.map((pos, i) => ({ pos, name: teamPlayerLabel(code, i + 1) }));
}

/** A dot on the formation pitch (x/y in %, shirt number). */
export interface FormationDot {
  x: number;
  y: number;
  number: number;
}

/** Curated tactical shape per team; others get a stable pick so the same team always lines up the same. */
const TEAM_FORMATION: Record<string, string> = {
  SUI: '4-2-3-1', COL: '4-2-3-1', POR: '4-3-3', ESP: '4-3-3', BRA: '4-2-3-1', NOR: '4-3-3',
  CAN: '4-4-2', MAR: '4-3-3', ARG: '4-4-2', FRA: '4-3-3', BEL: '3-4-2-1', MEX: '4-3-3',
  GER: '4-2-3-1', ENG: '4-2-3-1', NED: '4-3-3',
};
const FALLBACK_FORMATIONS = ['4-3-3', '4-2-3-1', '3-4-3', '4-4-2'];

/** Tactical shape ("4-3-3") for a team code — curated when known, else a stable deterministic pick. */
export function formationFor(code: string): string {
  return TEAM_FORMATION[code?.toUpperCase()] ?? FALLBACK_FORMATIONS[hash(code ?? '') % FALLBACK_FORMATIONS.length];
}

/**
 * Lay a formation string out as dots on a horizontal pitch. Home defends the left and attacks right; away
 * mirrors it. GK sits on the goal line, then each line of the shape spreads from defence to the centre.
 */
export function formationDots(shape: string, side: 'home' | 'away'): FormationDot[] {
  const lines = shape.split('-').map((n) => Math.max(1, Number(n) || 0));
  const home = side === 'home';
  const dots: FormationDot[] = [{ x: home ? 6 : 94, y: 50, number: 1 }];
  let number = 2;
  lines.forEach((count, li) => {
    const t = (li + 1) / (lines.length + 1); // 0..1 from own third to the centre
    const x = Math.round(home ? 12 + t * 38 : 88 - t * 38);
    for (let i = 0; i < count; i += 1) {
      const y = count === 1 ? 50 : Math.round(18 + (i * (82 - 18)) / (count - 1));
      dots.push({ x, y, number: number++ });
    }
  });
  return dots;
}
