import {
  Pulse,
  CalendarDots,
  Crown,
  GameController,
  Gift,
  Package,
  Play,
  Sparkle,
  Target,
  Trophy,
  type Icon,
} from '@/components/common/icons';
import { AppMode } from '@/enums/app-mode.enum';
import { Tone } from '@/enums/tone.enum';

export interface Team {
  code: string;
  flag: string;
}

export interface Fixture {
  id: string;
  home: Team;
  away: Team;
  kickoff: string;
  live?: boolean;
}

export const liveNow = {
  usersOnline: 24800,
  liveMatches: 6,
  changePct: 12.4,
  trend: [12, 18, 14, 22, 19, 28, 24, 33, 29, 38, 34, 42],
};

export const upcomingSummary: { total: number; fixtures: Fixture[] } = {
  total: 12,
  fixtures: [
    { id: 'bra-ger', home: { code: 'BRA', flag: '🇧🇷' }, away: { code: 'GER', flag: '🇩🇪' }, kickoff: '17:00' },
    { id: 'esp-uru', home: { code: 'ESP', flag: '🇪🇸' }, away: { code: 'URU', flag: '🇺🇾' }, kickoff: '19:30' },
    { id: 'por-bel', home: { code: 'POR', flag: '🇵🇹' }, away: { code: 'BEL', flag: '🇧🇪' }, kickoff: 'Tomorrow' },
  ],
};

export interface LeagueStat {
  name: string;
  followers: number;
}

export const topLeagues: LeagueStat[] = [
  { name: 'World Cup 2026', followers: 1200000 },
  { name: 'Premier League', followers: 760000 },
  { name: 'La Liga', followers: 540000 },
  { name: 'Serie A', followers: 420000 },
  { name: 'Bundesliga', followers: 380000 },
];

export const userPoints = {
  total: 2450,
  tier: 'Gold tier',
  nextReward: 3000,
  rewardFrom: 1000,
};

export const upcomingMatches: Fixture[] = [
  { id: 'bra-ger-2', home: { code: 'BRA', flag: '🇧🇷' }, away: { code: 'GER', flag: '🇩🇪' }, kickoff: 'Today 17:00' },
  { id: 'esp-uru-2', home: { code: 'ESP', flag: '🇪🇸' }, away: { code: 'URU', flag: '🇺🇾' }, kickoff: 'Today 19:30' },
  { id: 'por-bel-2', home: { code: 'POR', flag: '🇵🇹' }, away: { code: 'BEL', flag: '🇧🇪' }, kickoff: 'Tomorrow 16:00' },
  { id: 'eng-fra', home: { code: 'ENG', flag: '🇬🇧' }, away: { code: 'FRA', flag: '🇫🇷' }, kickoff: 'Tomorrow 18:00' },
  { id: 'ned-arg', home: { code: 'NED', flag: '🇳🇱' }, away: { code: 'ARG', flag: '🇦🇷' }, kickoff: 'Sat 20:00' },
];

export interface RankedPlayer {
  rank: number;
  name: string;
  flag: string;
  points: number;
  you?: boolean;
}

export const topPlayers: RankedPlayer[] = [
  { rank: 1, name: 'PixelMessi10', flag: '🇧🇷', points: 12490 },
  { rank: 2, name: 'GolMaster', flag: '🇦🇷', points: 11220 },
  { rank: 3, name: 'HatTrick23', flag: '🇪🇸', points: 10550 },
  { rank: 4, name: 'BlueForce', flag: '🇫🇷', points: 9740 },
  { rank: 5, name: 'KickMaster', flag: '🇩🇪', points: 8540 },
  { rank: 128, name: 'You', flag: '🇧🇷', points: 2490, you: true },
];

export interface PackData {
  id: string;
  name: string;
  tagline: string;
  players: number;
  rares: number;
  topRating: string;
  price: number;
  tone: Tone;
  icon: Icon;
}

export const featuredPacks: PackData[] = [
  { id: 'gold', name: 'Gold Pack', tagline: 'Start your collection', players: 6, rares: 1, topRating: '80+', price: 900, tone: Tone.Warning, icon: Package },
  { id: 'epic', name: 'Epic Pack', tagline: 'Guaranteed top players', players: 12, rares: 3, topRating: '85+', price: 1000, tone: Tone.Info, icon: Sparkle },
  { id: 'legend', name: 'Legendary Pack', tagline: 'The best in the world', players: 20, rares: 5, topRating: '90+', price: 2000, tone: Tone.Primary, icon: Crown },
];

export interface PlayMode {
  key: string;
  title: string;
  description: string;
  features: string[];
  href: string;
  cta: string;
  icon: Icon;
  tone: Tone;
  badge?: string;
}

export const playModes: PlayMode[] = [
  {
    key: 'live',
    title: 'Live Mode',
    description: 'Follow real matches in real time, predict and bet every single minute.',
    features: ['Instant predictions', 'Real-time chat & community', 'Rewards as it happens'],
    href: `/${AppMode.Live}`,
    cta: 'Enter Live',
    icon: Pulse,
    tone: Tone.Danger,
    badge: 'Live',
  },
  {
    key: 'fantasy',
    title: 'Fantasy Mode',
    description: 'Build your dream XI and face other users in 3D simulated matches.',
    features: ['Open packs & collect', 'Challenge your friends', 'Win epic rewards'],
    href: `/${AppMode.Fantasy}`,
    cta: 'Play Fantasy',
    icon: GameController,
    tone: Tone.Info,
  },
  {
    key: 'predict',
    title: 'Predictions',
    description: 'Call the outcomes and climb the global ranking with points.',
    features: ['Daily predictions', 'Global ranking', 'Points & streaks'],
    href: '#',
    cta: 'Make Predictions',
    icon: Target,
    tone: Tone.Primary,
  },
];

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  icon: Icon;
}

export const howItWorksSteps: HowItWorksStep[] = [
  { step: '01', title: 'Watch & participate', description: 'Join live matches, predictions and the crowd chat.', icon: Play },
  { step: '02', title: 'Make predictions', description: 'Answer instant questions and stack up points.', icon: Target },
  { step: '03', title: 'Earn points', description: 'Climb the global ranking every single round.', icon: Trophy },
  { step: '04', title: 'Get rewards', description: 'Trade your points for packs and prizes.', icon: Gift },
];

export interface FooterColumn {
  title: string;
  links: string[];
}

export const footerColumns: FooterColumn[] = [
  { title: 'Navigation', links: ['Home', 'Matches', 'Fantasy', 'Predictions'] },
  { title: 'Support', links: ['Help', 'Leaderboard', 'Store', 'Rewards'] },
  { title: 'Legal', links: ['About', 'Contact', 'Terms of Use', 'Privacy Policy'] },
];

export interface AppBadge {
  store: string;
  tagline: string;
}

export const appBadges: AppBadge[] = [
  { store: 'App Store', tagline: 'Download on the' },
  { store: 'Google Play', tagline: 'Get it on' },
];

export const calendarIcon: Icon = CalendarDots;
