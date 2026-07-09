import type { PlayerCardData } from '@/config/fantasy-cards.config';
import type { CollectionCard } from '@/services/fantasy.service';
import type { SimCard, SimStats, TeamStrength } from './types';

/** Positions counted as the attacking line (weighted 2× in the attack rating). */
const ATTACK_POSITIONS = new Set(['ST', 'CF', 'SS', 'LW', 'RW', 'CAM']);
/** Positions counted as the defensive line (weighted 2× in the defense rating). */
const DEFENSE_POSITIONS = new Set(['CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'DEF']);
const GK_POSITION = 'GK';

/** Card-stat labels (CardStat[].label) → SimStats keys. */
const LABEL_TO_KEY: Record<string, keyof SimStats> = {
  PAC: 'pac',
  SHO: 'sho',
  PAS: 'pas',
  DRI: 'dri',
  DEF: 'def',
  PHY: 'phy',
};

/** Squads with no GK card get the squad average minus this handicap as their keeper rating. */
const NO_GK_HANDICAP = 4;

/** Config `PlayerCardData` (mock decks) → simulator card. */
export function fromPlayerCardData(card: PlayerCardData): SimCard {
  return { name: card.name, rating: card.rating, position: card.position, stats: { ...card.stats } };
}

/** Holo `CollectionCard` (label-keyed stats) → simulator card; missing stats fall back to the rating. */
export function fromCollectionCard(card: CollectionCard): SimCard {
  const rating = card.number ?? 78;
  const stats: SimStats = { pac: rating, sho: rating, pas: rating, dri: rating, def: rating, phy: rating };
  for (const s of card.stats ?? []) {
    const key = LABEL_TO_KEY[s.label];
    if (key) stats[key] = s.value;
  }
  return { name: card.name, rating, position: card.position ?? '', stats };
}

const avg = (values: number[]): number => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

/** Weighted mean where `heavy` members count double. */
function weightedAvg(cards: SimCard[], value: (c: SimCard) => number, heavy: (c: SimCard) => boolean): number {
  let sum = 0;
  let weight = 0;
  for (const c of cards) {
    const w = heavy(c) ? 2 : 1;
    sum += value(c) * w;
    weight += w;
  }
  return weight ? sum / weight : 0;
}

/**
 * Squad → chance-battle ratings (Hattrick-style): midfield contests possession, attack meets defense,
 * the finisher meets the keeper. Pure — the same cards always yield the same strengths.
 */
export function computeTeamStrength(cards: SimCard[]): TeamStrength {
  const outfield = cards.filter((c) => c.position !== GK_POSITION);
  const pool = outfield.length ? outfield : cards;
  const gk = cards.find((c) => c.position === GK_POSITION);
  const squadAvg = avg(cards.map((c) => c.rating)) || 78;
  return {
    midfield: avg(pool.map((c) => c.stats.pas * 0.6 + c.stats.dri * 0.4)),
    attack: weightedAvg(pool, (c) => c.stats.sho * 0.6 + c.stats.dri * 0.4, (c) => ATTACK_POSITIONS.has(c.position)),
    defense: weightedAvg(pool, (c) => c.stats.def * 0.7 + c.stats.phy * 0.3, (c) => DEFENSE_POSITIONS.has(c.position)),
    keeper: gk ? gk.rating : squadAvg - NO_GK_HANDICAP,
  };
}
