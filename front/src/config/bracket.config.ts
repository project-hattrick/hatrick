/** Generic knockout bracket data — flags + 3-letter codes only, no FIFA marks. */

export interface BracketTeam {
  code: string;
  name: string;
  flag: string;
}

export interface BracketMatch {
  id: string;
  home: BracketTeam;
  away: BracketTeam;
  homeScore?: number;
  awayScore?: number;
  winner?: 'home' | 'away';
  upcoming?: boolean;
}

export interface BracketRound {
  title: string;
  matches: BracketMatch[];
}

const T = {
  bra: { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  arg: { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  fra: { code: 'FRA', name: 'France', flag: '🇫🇷' },
  esp: { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
  por: { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  eng: { code: 'ENG', name: 'England', flag: '🏴' },
  ned: { code: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  cro: { code: 'CRO', name: 'Croatia', flag: '🇭🇷' },
} as const;

export const bracketRounds: BracketRound[] = [
  {
    title: 'Quarterfinals',
    matches: [
      { id: 'qf1', home: T.bra, away: T.cro, homeScore: 2, awayScore: 1, winner: 'home' },
      { id: 'qf2', home: T.ned, away: T.arg, homeScore: 0, awayScore: 1, winner: 'away' },
      { id: 'qf3', home: T.fra, away: T.eng, homeScore: 3, awayScore: 2, winner: 'home' },
      { id: 'qf4', home: T.esp, away: T.por, homeScore: 2, awayScore: 0, winner: 'home' },
    ],
  },
  {
    title: 'Semifinals',
    matches: [
      { id: 'sf1', home: T.bra, away: T.arg, homeScore: 1, awayScore: 2, winner: 'away' },
      { id: 'sf2', home: T.fra, away: T.esp, homeScore: 0, awayScore: 1, winner: 'away' },
    ],
  },
  {
    title: 'Final',
    matches: [{ id: 'final', home: T.arg, away: T.esp, upcoming: true }],
  },
];
