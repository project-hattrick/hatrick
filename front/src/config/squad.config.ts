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
  photo: number;
  playedTime: number;
  goals: number;
  assists: number;
}

export const squad: SquadPlayer[] = [
  { id: 'antony', number: 7, name: 'Antony Santos', position: 'Forward', group: SquadGroup.Attack, country: 'Brazil', flag: '🇧🇷', photo: 12, playedTime: 504, goals: 3, assists: 3 },
  { id: 'hernandez', number: 19, name: 'C. Hernández', position: 'Forward', group: SquadGroup.Attack, country: 'Colombia', flag: '🇨🇴', photo: 33, playedTime: 310, goals: 2, assists: 2 },
  { id: 'pablo', number: 52, name: 'Pablo G.', position: 'Winger', group: SquadGroup.Attack, country: 'Spain', flag: '🇪🇸', photo: 51, playedTime: 23, goals: 1, assists: 0 },
  { id: 'isco', number: 22, name: 'Isco', position: 'Midfielder', group: SquadGroup.Midfield, country: 'Spain', flag: '🇪🇸', photo: 8, playedTime: 612, goals: 4, assists: 6 },
  { id: 'fornals', number: 8, name: 'P. Fornals', position: 'Midfielder', group: SquadGroup.Midfield, country: 'Spain', flag: '🇪🇸', photo: 14, playedTime: 540, goals: 2, assists: 5 },
  { id: 'carvalho', number: 14, name: 'W. Carvalho', position: 'Midfielder', group: SquadGroup.Midfield, country: 'Portugal', flag: '🇵🇹', photo: 60, playedTime: 480, goals: 1, assists: 2 },
  { id: 'bartra', number: 5, name: 'M. Bartra', position: 'Defender', group: SquadGroup.Defense, country: 'Spain', flag: '🇪🇸', photo: 5, playedTime: 720, goals: 1, assists: 0 },
  { id: 'pezzella', number: 16, name: 'G. Pezzella', position: 'Defender', group: SquadGroup.Defense, country: 'Argentina', flag: '🇦🇷', photo: 53, playedTime: 690, goals: 2, assists: 1 },
  { id: 'rui', number: 13, name: 'Rui Silva', position: 'Goalkeeper', group: SquadGroup.Goalkeeper, country: 'Portugal', flag: '🇵🇹', photo: 68, playedTime: 810, goals: 0, assists: 0 },
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
