import { Trophy, Fire, Sparkle, Medal, type Icon } from '@/components/common/icons';
import type { PlayerProfile } from '@/config/duelists.config';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Stable hash so mock stats stay identical across renders (no hydration drift). */
const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export const winRate = (p: PlayerProfile): number => {
  const duels = p.wins + p.losses;
  return duels ? Math.round((p.wins / duels) * 100) : 0;
};

/** Pseudo global rank derived from MMR (higher rating → better rank). */
export const rankFromRating = (rating: number): number => Math.max(1, Math.round((2000 - rating) / 3));

export const formatJoined = (iso: string): string => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export interface HeadToHead {
  mine: number;
  theirs: number;
}

/** Deterministic head-to-head record between the signed-in user and this profile (mock). */
export const headToHead = (p: PlayerProfile): HeadToHead => {
  const h = hash(p.id);
  return { mine: 3 + (h % 6), theirs: 1 + ((h >> 3) % 5) };
};

export interface StatTile {
  label: string;
  value: string;
  accent?: boolean;
}

export const statTiles = (p: PlayerProfile): StatTile[] => [
  { label: 'Duels', value: String(p.wins + p.losses) },
  { label: 'Win rate', value: `${winRate(p)}%`, accent: true },
  { label: 'MMR', value: String(p.rating) },
  { label: 'Cards', value: String(40 + (hash(p.username) % 160)) },
];

export interface Achievement {
  icon: Icon;
  label: string;
  /** text-* accent class. */
  text: string;
  /** Chip classes (bg-… + ring-…). */
  chip: string;
}

/** Featured achievement badges — mapped onto DS tokens (no off-palette colours). */
export const achievements: Achievement[] = [
  { icon: Trophy, label: 'Two-time champ', text: 'text-warning', chip: 'bg-warning/10 ring-warning/40' },
  { icon: Fire, label: '20 win streak', text: 'text-neon', chip: 'bg-neon/10 ring-neon/35' },
  { icon: Sparkle, label: 'Collector', text: 'text-team-home', chip: 'bg-team-home/10 ring-team-home/40' },
  { icon: Medal, label: 'Top 100', text: 'text-hot', chip: 'bg-hot/10 ring-hot/40' },
];
