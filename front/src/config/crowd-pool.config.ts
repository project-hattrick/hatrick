import { TeamSide } from '@/enums/team-side.enum';

interface CrowdCountry {
  code: string;
  flag: string;
  side: TeamSide;
}

export const crowdCountries: CrowdCountry[] = [
  { code: 'ARG', flag: '🇦🇷', side: TeamSide.Home },
  { code: 'FRA', flag: '🇫🇷', side: TeamSide.Away },
  { code: 'BRA', flag: '🇧🇷', side: TeamSide.Home },
  { code: 'ESP', flag: '🇪🇸', side: TeamSide.Home },
  { code: 'GER', flag: '🇩🇪', side: TeamSide.Away },
  { code: 'POR', flag: '🇵🇹', side: TeamSide.Home },
  { code: 'ITA', flag: '🇮🇹', side: TeamSide.Away },
  { code: 'NED', flag: '🇳🇱', side: TeamSide.Home },
  { code: 'GBR', flag: '🇬🇧', side: TeamSide.Away },
  { code: 'USA', flag: '🇺🇸', side: TeamSide.Away },
  { code: 'MEX', flag: '🇲🇽', side: TeamSide.Home },
  { code: 'JPN', flag: '🇯🇵', side: TeamSide.Away },
];

export const crowdAuthors: string[] = [
  'PixelMessi10', 'BleuForce', 'GolMaker', 'HatTrick23', 'LesParisien', 'AlbicelesteFan',
  'NeonUltra', 'SambaKing', 'TikiTaka', 'DerKaiser', 'OranjeBoss', 'ElTri', 'SamuraiBlue',
  'GoalHunter', 'UltraSur', 'CurvaNord', 'KopEnd', 'GreenWall', 'TifoLord', 'CornerFlag',
];

export const crowdTexts: string[] = [
  'QUE GOLAÇO! 🔥', 'Allez les bleus! 🇫🇷', 'Vamos! 💪', 'What a match 🍿', 'Offside! 🚩',
  'Referee is blind 👀', 'GOOOOL! ⚽', 'Defense is sleeping 😴', 'Best on the pitch 🌟',
  'Penalty!! 😡', 'Counter attack! ⚡', 'Save of the season 🧤', 'We win this 🏆',
  'Sub him already 🔁', 'Crossbar!! 😱', 'Tiki-taka 🎯', 'Pressing high 🔝', 'VAR check... ⏳',
  'Magic from the winger ✨', 'Clinical finish 🎯', 'That was robbery 😤', 'Up the reds! ❤️',
  'Vamos Argentina! 🇦🇷', 'Unstoppable today 💥', 'Keeper is on fire 🧤🔥',
];
