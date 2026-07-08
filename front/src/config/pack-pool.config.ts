import { duelists } from './duelists.config';
import { statOrder, userCards } from './fantasy-cards.config';
import type { CardStat, HoloPlayerCardProps } from '@/components/store/holo-player-card';

/** A pullable pack card: the holo card props + the character's name for captions. */
export interface PackCard extends HoloPlayerCardProps {
  name: string;
  /** ISO country code for the flag chip (used by the mini deck card). */
  code?: string;
  /** Field position label, e.g. "ST". */
  position?: string;
}

/** FIFA code → flag emoji + tricolor refraction palette (every duelist nation). */
const NATION: Record<string, { flag: string; colors: [string, string, string] }> = {
  FRA: { flag: '🇫🇷', colors: ['#0055A4', '#FFFFFF', '#EF4135'] },
  ARG: { flag: '🇦🇷', colors: ['#74ACDF', '#FFFFFF', '#F6B40E'] },
  ESP: { flag: '🇪🇸', colors: ['#AA151B', '#F1BF00', '#AA151B'] },
  ENG: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', colors: ['#FFFFFF', '#CE1124', '#FFFFFF'] },
  GER: { flag: '🇩🇪', colors: ['#000000', '#DD0000', '#FFCE00'] },
  JPN: { flag: '🇯🇵', colors: ['#BC002D', '#FFFFFF', '#BC002D'] },
  NED: { flag: '🇳🇱', colors: ['#AE1C28', '#FFFFFF', '#21468B'] },
  ITA: { flag: '🇮🇹', colors: ['#009246', '#FFFFFF', '#CE2B37'] },
  URU: { flag: '🇺🇾', colors: ['#74ACDF', '#FFFFFF', '#FCD116'] },
  MEX: { flag: '🇲🇽', colors: ['#006847', '#FFFFFF', '#CE1126'] },
  BEL: { flag: '🇧🇪', colors: ['#000000', '#FDDA24', '#EF3340'] },
  CRO: { flag: '🇭🇷', colors: ['#FF0000', '#FFFFFF', '#171796'] },
  BRA: { flag: '🇧🇷', colors: ['#009739', '#FEDD00', '#012169'] },
  COL: { flag: '🇨🇴', colors: ['#FCD116', '#003893', '#CE1126'] },
  USA: { flag: '🇺🇸', colors: ['#B22234', '#FFFFFF', '#3C3B6E'] },
  POR: { flag: '🇵🇹', colors: ['#006600', '#FF0000', '#FFC400'] },
};

const FALLBACK_NATION = { flag: '🏳️', colors: ['#94A3B8', '#E2E8F0', '#64748B'] as [string, string, string] };

/** Stable per-name hash so a character's stats never change between pulls. */
const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const clampStat = (v: number): number => Math.max(48, Math.min(99, v));

/** Card rating from duel MMR (≈1180..1712 → ≈66..96). */
const ratingFor = (mmr: number): number => Math.max(65, Math.min(97, Math.round(mmr / 17.8)));

const STAT_LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'] as const;

/** Six outfield attributes jittered around the card rating, deterministic per character. */
const duelistStats = (seed: string, base: number): CardStat[] => {
  const h = hash(seed);
  return STAT_LABELS.map((label, i) => ({ label, value: clampStat(base - 9 + ((h >> (i * 3)) % 16)) }));
};

const fromFantasy: PackCard[] = userCards.map((card) => ({
  name: card.name,
  number: card.rating,
  flag: card.flag,
  holoColors: card.holoColors,
  portraitSrc: card.portraitSrc,
  stats: statOrder.map(([label, key]) => ({ label, value: card.stats[key] })),
}));

const fromDuelists: PackCard[] = duelists.map((d) => {
  const nation = NATION[d.country] ?? FALLBACK_NATION;
  const number = ratingFor(d.rating);
  return {
    name: d.name,
    number,
    flag: nation.flag,
    holoColors: nation.colors,
    portraitSrc: d.portraitSrc,
    stats: duelistStats(d.username, number),
  };
});

/** Every character in the game as a pullable card: the fantasy stars + all duelist personas. */
export const PACK_POOL: PackCard[] = [...fromFantasy, ...fromDuelists];

/** Random pack draw — `size` distinct cards from the full pool (call client-side on open). */
export function drawPack(size: number): PackCard[] {
  const pool = [...PACK_POOL];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(size, pool.length));
}
