/** Data for the home match-analytics dashboard (hero, live stats, chart, formation, standings). */

export interface DashTeam {
  name: string;
  short: string;
  code: string;
  portraitSrc: string;
}

/** Placement of a pixel-art hero figure on the match card. Tune it in /sandbox/hero-figures. */
export interface HeroFigurePlacement {
  /** Rendered width of the figure in px. */
  width: number;
  /** Horizontal translate in px from the anchored side edge. */
  x: number;
  /** Vertical translate in px (+ moves down). */
  y: number;
  /** Uniform scale multiplier. */
  scale: number;
  /** Mirror the figure horizontally. */
  flip: boolean;
  /** object-position Y in % (0 = top of the art, 100 = bottom). */
  objectY: number;
}

export interface HeroTeam extends DashTeam {
  placement: HeroFigurePlacement;
}

export interface HeroMatch {
  home: HeroTeam;
  away: HeroTeam;
  label: string;
  countdown: { days: number; hours: number; minutes: number; seconds: number };
}

export const heroMatch: HeroMatch = {
  home: {
    name: 'Argentina', short: 'ARG', code: 'ar', portraitSrc: '/cards/hero-arg.png',
    placement: { width: 190, x: -7, y: 6, scale: 1, flip: false, objectY: 5 },
  },
  away: {
    name: 'Brazil', short: 'BRA', code: 'br', portraitSrc: '/cards/hero-bra.png',
    placement: { width: 150, x: 2, y: 4, scale: 1, flip: false, objectY: 8 },
  },
  label: 'Sunday, 21 January',
  // Countdown target as a fixed remaining offset (days/hours/mins/secs) — mock, not wall-clock.
  countdown: { days: 3, hours: 12, minutes: 43, seconds: 14 },
};

/** Default figure placement per card side — used for portraits without a tuned override. */
export const DEFAULT_FIGURE_PLACEMENT: Record<'home' | 'away', HeroFigurePlacement> = {
  home: { width: 170, x: -4, y: 6, scale: 1, flip: false, objectY: 5 },
  away: { width: 170, x: -4, y: 6, scale: 1, flip: true, objectY: 5 },
};

/** Pixel-art portrait + optional per-side hand-tuned placements (tune in /sandbox/hero-figures). */
export interface HeroPortrait {
  src: string;
  home?: HeroFigurePlacement;
  away?: HeroFigurePlacement;
}

/** Hero portraits by FIFA code. Sides without a tuned placement use DEFAULT_FIGURE_PLACEMENT. */
export const HERO_PORTRAITS: Record<string, HeroPortrait> = {
  ARG: { src: '/cards/hero-arg.png', home: heroMatch.home.placement },
  BRA: { src: '/cards/hero-bra.png', away: heroMatch.away.placement },
  ENG: { src: '/cards/hero-eng.png', away: { width: 170, x: -143, y: 5, scale: 1, flip: true, objectY: 0 } },
  NOR: { src: '/cards/hero-nor.png', away: { width: 170, x: -145, y: 5, scale: 1, flip: true, objectY: 0 } },
  BEL: { src: '/cards/hero-bel.png', away: { width: 170, x: -157, y: 9, scale: 1, flip: true, objectY: 0 } },
  ESP: { src: '/cards/hero-esp.png', home: { width: 170, x: -4, y: 6, scale: 1, flip: false, objectY: 0 } },
  FRA: {
    src: '/cards/hero-fra.png',
    home: { width: 170, x: -4, y: 6, scale: 1, flip: false, objectY: 5 },
    away: { width: 170, x: -144, y: 6, scale: 1, flip: true, objectY: 5 },
  },
  MAR: { src: '/cards/hero-mar.png', away: { width: 170, x: -155, y: 6, scale: 1, flip: true, objectY: 0 } },
  SUI: { src: '/cards/hero-sui.png', away: { width: 170, x: -155, y: 4, scale: 1, flip: true, objectY: 0 } },
};

/** Hero figure (portrait + placement) for a fixture team — heroMatch default when no art exists. */
export function heroTeamFor(name: string, fifaCode: string, side: 'home' | 'away'): HeroTeam {
  const code = fifaCode.toUpperCase();
  const entry = HERO_PORTRAITS[code];
  if (!entry) return heroMatch[side];
  const placement = entry[side] ?? DEFAULT_FIGURE_PLACEMENT[side];
  return { name, short: code, code, portraitSrc: entry.src, placement };
}

export interface StatLine {
  label: string;
  home: number;
  away: number;
}

export const liveMatch = {
  home: { short: 'MEX', code: 'mx' },
  away: { short: 'SWE', code: 'se' },
  score: { home: 2, away: 2 },
  minute: 64,
  stats: [
    { label: 'Shoot on Target', home: 7, away: 4 },
    { label: 'Shoot', home: 12, away: 9 },
    { label: 'Fouls', home: 7, away: 6 },
  ] satisfies StatLine[],
};

// Two performance series (0–100), evenly spaced across the timeline labels.
export const performance = {
  labels: ['0m', '15m', '30m', '45m', '60m', '75m', '90m'],
  home: { name: 'Portugal', color: '#aef019', points: [30, 42, 38, 55, 62, 70, 66] },
  away: { name: 'Belgium', color: '#e2b33c', points: [24, 30, 46, 40, 52, 48, 58] },
};

export const teamStatistic: { home: string; away: string; lines: StatLine[] } = {
  home: 'Portugal',
  away: 'Belgium',
  lines: [
    { label: 'Pass', home: 542, away: 431 },
    { label: 'Shoot', home: 8, away: 6 },
    { label: 'Shoot on Target', home: 6, away: 3 },
    { label: 'Ball Possession', home: 54, away: 46 },
    { label: 'Red Card', home: 0, away: 0 },
    { label: 'Yellow Card', home: 2, away: 5 },
    { label: 'Offside', home: 4, away: 2 },
    { label: 'Corner', home: 8, away: 4 },
  ],
};

export interface FormationDot {
  x: number;
  y: number;
  number: number;
}

// Both teams on one horizontal pitch — home attacks right, away attacks left.
export const teamFormation = {
  home: { name: 'Portugal', shape: '4-3-3', code: 'pt', color: '#e5484d', dots: buildLeft() },
  away: { name: 'Belgium', shape: '3-4-3', code: 'be', color: '#e2b33c', dots: buildRight() },
};

function buildLeft(): FormationDot[] {
  return [
    { x: 6, y: 50, number: 1 },
    { x: 20, y: 22, number: 4 },
    { x: 20, y: 50, number: 3 },
    { x: 20, y: 78, number: 5 },
    { x: 34, y: 35, number: 6 },
    { x: 34, y: 65, number: 8 },
    { x: 40, y: 50, number: 10 },
    { x: 46, y: 20, number: 7 },
    { x: 46, y: 80, number: 11 },
    { x: 44, y: 42, number: 9 },
    { x: 44, y: 60, number: 2 },
  ];
}

function buildRight(): FormationDot[] {
  return [
    { x: 94, y: 50, number: 1 },
    { x: 80, y: 30, number: 3 },
    { x: 80, y: 50, number: 4 },
    { x: 80, y: 70, number: 5 },
    { x: 66, y: 22, number: 6 },
    { x: 66, y: 42, number: 7 },
    { x: 66, y: 60, number: 8 },
    { x: 66, y: 80, number: 10 },
    { x: 56, y: 30, number: 9 },
    { x: 56, y: 50, number: 11 },
    { x: 56, y: 70, number: 2 },
  ];
}

export interface LineupRow {
  pos: string;
  home: string;
  away: string;
}

export const lineup: LineupRow[] = [
  { pos: 'GK', home: 'Diogo Costa', away: 'T. Courtois' },
  { pos: 'DF', home: 'Danilo Pereira', away: 'Wout Faes' },
  { pos: 'DF', home: 'Pepe', away: 'T. Meunier' },
  { pos: 'DF', home: 'Rúben Dias', away: 'A. Theate' },
  { pos: 'MF', home: 'Bernardo Silva', away: 'Kevin De B.' },
  { pos: 'MF', home: 'João Palhinha', away: 'A. Witsel' },
  { pos: 'MF', home: 'Nuno Mendes', away: 'H. Vanaken' },
  { pos: 'FW', home: 'C. Ronaldo', away: 'R. Lukaku' },
  { pos: 'FW', home: 'João Félix', away: 'E. Hazard' },
  { pos: 'FW', home: 'Ricardo Horta', away: 'D. Mertens' },
];

export type MatchResult = 'W' | 'D' | 'L';

export interface GroupTeam {
  name: string;
  code: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
  form: MatchResult[];
}

export interface Group {
  key: string;
  teams: GroupTeam[];
}

/** World Cup group stage — teams pre-sorted by points; the top two advance. */
export const groupStage: Group[] = [
  {
    key: 'A',
    teams: [
      { name: 'Brazil', code: 'br', p: 3, w: 3, d: 0, l: 0, gf: 7, ga: 1, pts: 9, form: ['W', 'W', 'W'] },
      { name: 'Switzerland', code: 'ch', p: 3, w: 1, d: 1, l: 1, gf: 4, ga: 3, pts: 4, form: ['W', 'D', 'L'] },
      { name: 'Serbia', code: 'rs', p: 3, w: 1, d: 0, l: 2, gf: 5, ga: 6, pts: 3, form: ['L', 'W', 'L'] },
      { name: 'Cameroon', code: 'cm', p: 3, w: 0, d: 1, l: 2, gf: 2, ga: 8, pts: 1, form: ['L', 'D', 'L'] },
    ],
  },
  {
    key: 'B',
    teams: [
      { name: 'Argentina', code: 'ar', p: 3, w: 2, d: 1, l: 0, gf: 6, ga: 2, pts: 7, form: ['W', 'D', 'W'] },
      { name: 'Mexico', code: 'mx', p: 3, w: 1, d: 1, l: 1, gf: 3, ga: 3, pts: 4, form: ['W', 'L', 'D'] },
      { name: 'Poland', code: 'pl', p: 3, w: 1, d: 1, l: 1, gf: 2, ga: 2, pts: 4, form: ['D', 'W', 'L'] },
      { name: 'Saudi Arabia', code: 'sa', p: 3, w: 0, d: 1, l: 2, gf: 2, ga: 6, pts: 1, form: ['L', 'L', 'D'] },
    ],
  },
  {
    key: 'C',
    teams: [
      { name: 'France', code: 'fr', p: 3, w: 2, d: 0, l: 1, gf: 6, ga: 3, pts: 6, form: ['W', 'L', 'W'] },
      { name: 'Portugal', code: 'pt', p: 3, w: 2, d: 0, l: 1, gf: 5, ga: 3, pts: 6, form: ['W', 'W', 'L'] },
      { name: 'Denmark', code: 'dk', p: 3, w: 1, d: 1, l: 1, gf: 3, ga: 3, pts: 4, form: ['D', 'W', 'L'] },
      { name: 'Australia', code: 'au', p: 3, w: 0, d: 1, l: 2, gf: 1, ga: 6, pts: 1, form: ['L', 'D', 'L'] },
    ],
  },
  {
    key: 'D',
    teams: [
      { name: 'Spain', code: 'es', p: 3, w: 2, d: 1, l: 0, gf: 8, ga: 2, pts: 7, form: ['W', 'W', 'D'] },
      { name: 'Germany', code: 'de', p: 3, w: 1, d: 1, l: 1, gf: 5, ga: 4, pts: 4, form: ['W', 'D', 'L'] },
      { name: 'Japan', code: 'jp', p: 3, w: 1, d: 1, l: 1, gf: 3, ga: 4, pts: 4, form: ['D', 'L', 'W'] },
      { name: 'Morocco', code: 'ma', p: 3, w: 0, d: 1, l: 2, gf: 2, ga: 8, pts: 1, form: ['L', 'L', 'D'] },
    ],
  },
];
