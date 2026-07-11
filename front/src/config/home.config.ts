import {
  Pulse,
  CalendarDots,
  ChatCircle,
  GameController,
  Gift,
  Package,
  Play,
  Sword,
  Target,
  Trophy,
  Users,
  type Icon,
} from '@/components/common/icons';
import { AppMode } from '@/enums/app-mode.enum';

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

export interface LiveScoreMatch {
  id: string;
  home: Team;
  away: Team;
  homeScore: number;
  awayScore: number;
  minute: number;
}

export interface FeaturedLiveMatch extends LiveScoreMatch {
  viewers: number;
  halfLabel: string;
  spotlight: string;
  prediction: { question: string; yesPoints: number; noPoints: number };
}

export const featuredLiveMatch: FeaturedLiveMatch = {
  id: 'arg-fra-live',
  home: { code: 'ARG', flag: '🇦🇷' },
  away: { code: 'FRA', flag: '🇫🇷' },
  homeScore: 2,
  awayScore: 1,
  minute: 67,
  halfLabel: '2nd half',
  viewers: 24800,
  spotlight: 'ARG-10 on the ball',
  prediction: { question: 'Goal in the next 10 min?', yesPoints: 50, noPoints: 10 },
};

export const liveRailMatches: LiveScoreMatch[] = [
  { id: 'bra-mex-live', home: { code: 'BRA', flag: '🇧🇷' }, away: { code: 'MEX', flag: '🇲🇽' }, homeScore: 1, awayScore: 0, minute: 54 },
  { id: 'eng-ger-live', home: { code: 'ENG', flag: '🇬🇧' }, away: { code: 'GER', flag: '🇩🇪' }, homeScore: 0, awayScore: 0, minute: 23 },
];

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

export interface PlayModeFeature {
  label: string;
  icon: Icon;
}

export interface PlayMode {
  key: AppMode;
  title: string;
  description: string;
  features: PlayModeFeature[];
  href: string;
  cta: string;
  icon: Icon;
  badge?: string;
  art: string;
  emblem?: string;
}

export const playModes: PlayMode[] = [
  {
    key: AppMode.Live,
    title: 'Live',
    description: 'Follow real matches in real time, predict and bet every single minute.',
    features: [
      { label: 'Real-time', icon: Pulse },
      { label: 'Predictions', icon: Target },
      { label: 'Crowd chat', icon: ChatCircle },
      { label: 'Rewards', icon: Gift },
    ],
    href: `/${AppMode.Live}`,
    cta: 'Enter Live',
    icon: Pulse,
    badge: 'Live',
    art: '/prediction-goal.png',
  },
  {
    key: AppMode.Fantasy,
    title: 'Fantasy',
    description: 'Build your dream XI and face other users in 3D simulated matches.',
    features: [
      { label: 'Open packs', icon: Package },
      { label: '1v1 duels', icon: Sword },
      { label: 'Vs friends', icon: Users },
      { label: 'Epic prizes', icon: Trophy },
    ],
    href: `/${AppMode.Fantasy}`,
    cta: 'Play Fantasy',
    icon: GameController,
    art: '/cards/card-texture.png',
    emblem: '/cards/fade-logo.png',
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

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Navigation',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Live Mode', href: '/live' },
      { label: 'Fantasy', href: '/fantasy' },
      { label: 'Duelists', href: '/duelists' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Store', href: '/store' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Use', href: '/legal/terms' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Responsible Gaming', href: '/legal/responsible-gaming' },
      { label: 'Cookie Policy', href: '/legal/cookies' },
    ],
  },
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
