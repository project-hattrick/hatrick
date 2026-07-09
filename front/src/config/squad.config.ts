/** Position groups used to filter the squad via tabs. */
export enum SquadGroup {
  Attack = 'Attack',
  Midfield = 'Midfield',
  Defense = 'Defense',
  Goalkeeper = 'Goalkeeper',
}

export interface SquadPlayer {
  id: string;
  number: number;
  name: string;
  position: string;
  group: SquadGroup;
  country: string;
  flag: string;
  /** ISO 3166-1 alpha-2 for flag-icons. */
  code: string;
  /** Pixel-art portrait in /public/cards. */
  portraitSrc: string;
  playedTime: number;
  goals: number;
  assists: number;
}

// Fictional roster (mirrors formation.config) — no real-player names for licensing safety.
export const squad: SquadPlayer[] = [
  { id: 'duarte', number: 9, name: 'R. Duarte', position: 'Forward', group: SquadGroup.Attack, country: 'Brazil', flag: '🇧🇷', code: 'br', portraitSrc: '/cards/player-93.png', playedTime: 504, goals: 3, assists: 3 },
  { id: 'mensah', number: 11, name: 'K. Mensah', position: 'Forward', group: SquadGroup.Attack, country: 'Ghana', flag: '🇬🇭', code: 'gh', portraitSrc: '/cards/player-green.png', playedTime: 310, goals: 2, assists: 2 },
  { id: 'navarro', number: 7, name: 'J. Navarro', position: 'Winger', group: SquadGroup.Attack, country: 'Spain', flag: '🇪🇸', code: 'es', portraitSrc: '/cards/player-93.png', playedTime: 23, goals: 1, assists: 0 },
  { id: 'okafor', number: 8, name: 'T. Okafor', position: 'Midfielder', group: SquadGroup.Midfield, country: 'Nigeria', flag: '🇳🇬', code: 'ng', portraitSrc: '/cards/player-green.png', playedTime: 612, goals: 4, assists: 6 },
  { id: 'moreau', number: 10, name: 'L. Moreau', position: 'Midfielder', group: SquadGroup.Midfield, country: 'France', flag: '🇫🇷', code: 'fr', portraitSrc: '/cards/player-93.png', playedTime: 540, goals: 2, assists: 5 },
  { id: 'petrov', number: 14, name: 'S. Petrov', position: 'Midfielder', group: SquadGroup.Midfield, country: 'Bulgaria', flag: '🇧🇬', code: 'bg', portraitSrc: '/cards/player-green.png', playedTime: 480, goals: 1, assists: 2 },
  { id: 'weber', number: 5, name: 'M. Weber', position: 'Defender', group: SquadGroup.Defense, country: 'Germany', flag: '🇩🇪', code: 'de', portraitSrc: '/cards/player-93.png', playedTime: 720, goals: 1, assists: 0 },
  { id: 'rossi', number: 16, name: 'A. Rossi', position: 'Defender', group: SquadGroup.Defense, country: 'Italy', flag: '🇮🇹', code: 'it', portraitSrc: '/cards/player-green.png', playedTime: 690, goals: 2, assists: 1 },
  { id: 'kovac', number: 1, name: 'V. Kovac', position: 'Goalkeeper', group: SquadGroup.Goalkeeper, country: 'Croatia', flag: '🇭🇷', code: 'hr', portraitSrc: '/cards/player-keeper.png', playedTime: 810, goals: 0, assists: 0 },
];

export interface SquadTab {
  value: string;
  label: string;
}

export const squadTabs: SquadTab[] = [
  { value: 'all', label: 'All' },
  { value: SquadGroup.Attack, label: 'Attack' },
  { value: SquadGroup.Midfield, label: 'Midfield' },
  { value: SquadGroup.Defense, label: 'Defense' },
  { value: SquadGroup.Goalkeeper, label: 'Keepers' },
];
