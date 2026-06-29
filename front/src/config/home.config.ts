import { AppMode } from '@/enums/app-mode.enum';

interface ModeCardData {
  title: string;
  description: string;
  href: string;
  cta: string;
}

export const modeCards: ModeCardData[] = [
  {
    title: 'Live',
    description: 'Follow a real match as a 2D real-time view and bet in-match — one screen, every angle.',
    href: '/',
    cta: 'Watch Live',
  },
  {
    title: 'Fantasy',
    description: 'Open packs, build your XI, and face other users in 3D simulated matches driven by real data.',
    href: `/${AppMode.Fantasy}`,
    cta: 'Play Fantasy',
  },
];

interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
}

export const howItWorksSteps: HowItWorksStep[] = [
  { step: '01', title: 'Connect your wallet', description: 'Sign in on Solana devnet — no real money moves during the cup.' },
  { step: '02', title: 'Pick your mode', description: 'Jump into a live match or draft a fantasy squad from real players.' },
  { step: '03', title: 'Play every minute', description: 'Predict, bet and react to real events the instant TxLINE confirms them.' },
];

interface FeaturedMatch {
  id: string;
  home: string;
  away: string;
  kickoff: string;
}

export const featuredMatches: FeaturedMatch[] = [
  { id: 'arg-fra', home: 'ARG', away: 'FRA', kickoff: 'Live now' },
  { id: 'bra-esp', home: 'BRA', away: 'ESP', kickoff: 'Today 20:00' },
  { id: 'eng-ger', home: 'ENG', away: 'GER', kickoff: 'Tomorrow 16:00' },
  { id: 'por-ned', home: 'POR', away: 'NED', kickoff: 'Tomorrow 19:00' },
];

interface FooterColumn {
  title: string;
  links: string[];
}

export const footerColumns: FooterColumn[] = [
  { title: 'Product', links: ['Live', 'Fantasy', 'Wallet', 'Markets'] },
  { title: 'Company', links: ['About', 'Careers', 'Press', 'Contact'] },
  { title: 'Legal', links: ['Terms', 'Privacy', 'Responsible play', 'Geo policy'] },
];
