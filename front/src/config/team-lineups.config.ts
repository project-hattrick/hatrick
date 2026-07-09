/**
 * Starting XI per national team for the "Team Line Up" card, so the lineup reflects the SELECTED match
 * instead of a fixed Portugal/Belgium mock. ILLUSTRATIVE, curated static data — the TxLINE feed used here
 * carries no lineups, so these are hand-kept 4-3-3 XIs (GK + 4 DF + 3 MF + 3 FW = 11), keyed by FIFA short
 * code. Teams not curated fall back to a deterministic generic set (so it's never the wrong team).
 */

/** Position tags down the card, one per lineup row — a 4-3-3. */
export const LINEUP_POSITIONS = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'] as const;

export interface LineupPlayer {
  pos: string;
  name: string;
}

/** Curated 11-man 4-3-3 XIs (GK first) for the teams that appear in the replay catalog + recap. */
const TEAM_XI: Record<string, string[]> = {
  SUI: ['Sommer', 'Widmer', 'Akanji', 'Schär', 'Rodríguez', 'Xhaka', 'Freuler', 'Sow', 'Shaqiri', 'Embolo', 'Vargas'],
  COL: ['C. Vargas', 'Muñoz', 'Cuesta', 'Lucumí', 'Mojica', 'James', 'Lerma', 'Uribe', 'L. Díaz', 'Córdoba', 'Borré'],
  POR: ['Diogo Costa', 'Cancelo', 'Pepe', 'Rúben Dias', 'N. Mendes', 'Palhinha', 'Vitinha', 'B. Fernandes', 'B. Silva', 'Ronaldo', 'Leão'],
  ESP: ['U. Simón', 'Carvajal', 'Le Normand', 'Laporte', 'Cucurella', 'Rodri', 'Pedri', 'Gavi', 'Yamal', 'Morata', 'N. Williams'],
  BRA: ['Alisson', 'Danilo', 'Marquinhos', 'G. Magalhães', 'Wendell', 'Bruno G.', 'Paquetá', 'Casemiro', 'Raphinha', 'Vini Jr.', 'Rodrygo'],
  NOR: ['Nyland', 'Ryerson', 'Ajer', 'Østigård', 'M. Wolfe', 'Berge', 'Ødegaard', 'Thorstvedt', 'Nusa', 'Sørloth', 'Haaland'],
  CAN: ['Crépeau', 'Johnston', 'Vitória', 'Miller', 'A. Davies', 'Eustáquio', 'Koné', 'Kaye', 'Buchanan', 'J. David', 'Larin'],
  MAR: ['Bounou', 'Hakimi', 'Aguerd', 'Saïss', 'Mazraoui', 'Amrabat', 'Ounahi', 'Amallah', 'Ziyech', 'En-Nesyri', 'Boufal'],
  ARG: ['E. Martínez', 'Molina', 'Otamendi', 'Romero', 'Tagliafico', 'De Paul', 'Mac Allister', 'E. Fernández', 'Messi', 'J. Álvarez', 'Di María'],
  FRA: ['Maignan', 'Koundé', 'Saliba', 'Upamecano', 'T. Hernández', 'Tchouaméni', 'Camavinga', 'Griezmann', 'Dembélé', 'Mbappé', 'Kolo Muani'],
  BEL: ['Courtois', 'Meunier', 'Faes', 'Theate', 'Castagne', 'Onana', 'Witsel', 'De Bruyne', 'Lukaku', 'Trossard', 'Doku'],
  MEX: ['Ochoa', 'Sánchez', 'Montes', 'Vásquez', 'Gallardo', 'E. Álvarez', 'L. Chávez', 'Rodríguez', 'Lozano', 'Antuna', 'H. Giménez'],
  GER: ['Neuer', 'Kimmich', 'Rüdiger', 'Tah', 'Raum', 'Andrich', 'Kroos', 'Musiala', 'Wirtz', 'Havertz', 'Sané'],
  ENG: ['Pickford', 'Walker', 'Stones', 'Guéhi', 'Trippier', 'Rice', 'Bellingham', 'Mainoo', 'Saka', 'Kane', 'Foden'],
  NED: ['Verbruggen', 'Dumfries', 'De Vrij', 'Van Dijk', 'Aké', 'Schouten', 'Reijnders', 'Veerman', 'Gakpo', 'Depay', 'Malen'],
};

/** Generic pool for uncurated teams — deterministic per code so a matchup always looks the same. */
const FALLBACK_POOL = [
  'Silva', 'Santos', 'Müller', 'Rossi', 'García', 'Kovač', 'Popov', 'Nguyen', 'Andersen', 'Yılmaz',
  'Okafor', 'Tanaka', 'Novak', 'Ibrahim', 'Costa', 'Meyer', 'Dubois', 'Ferreira', 'Petrov', 'Haddad',
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The starting XI (11 rows, 4-3-3) for a team code — curated when known, else a stable generic set. */
export function lineupFor(code: string): LineupPlayer[] {
  const names = TEAM_XI[code?.toUpperCase()];
  const base = hash(code ?? '');
  return LINEUP_POSITIONS.map((pos, i) => ({
    pos,
    name: names?.[i] ?? FALLBACK_POOL[(base + i * 7) % FALLBACK_POOL.length],
  }));
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
