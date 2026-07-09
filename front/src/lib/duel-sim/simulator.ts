import { ChanceOutcome, DuelSimTeam, type DuelChanceEvent, type DuelTimeline, type SimCard, type TeamStrength } from './types';
import { computeTeamStrength } from './strength';

/**
 * Hattrick-style chance-battle simulator: the 90' are a handful of discrete chances; per chance the
 * midfields contest possession, the winner's attack meets the loser's defense, and a clean shot meets
 * the keeper. Every roll is a proportional share powered by RATING_EXPONENT — the weaker side always
 * keeps a real (never zero) probability, and attributes are THE factor deciding the aggregate result.
 *
 * Calibration (see verify loop in the delivery notes): a 95-avg squad beats an 80-avg squad ~85% of
 * the time with rare upsets; equal squads land near 40/20/40 with ~2.8 total goals per match.
 */

/** How sharply a rating edge converts into probability share (per battle stage). */
const RATING_EXPONENT = 3.2;
/** Baseline chance slots per match (jittered ±CHANCE_JITTER, split across the halves). */
const CHANCES_PER_MATCH = 10;
const CHANCE_JITTER = 2;
/** Equal-teams probability that a won chance produces a clean shot. */
const SHOT_BASE = 0.7;
/** Equal-teams probability that a clean shot beats the keeper. */
const GOAL_BASE = 0.4;
/** A blocked build-up reads as a defensive steal this often (else the attack keeps a corner). */
const STEAL_SHARE = 0.6;
/** A beaten shot is a keeper save this often (else it flies off target). */
const SAVE_SHARE = 0.65;

/** djb2 string hash → PRNG seed, so a duel id always replays the same match. */
export function seedFromString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  return hash >>> 0;
}

/** Deterministic 32-bit PRNG (mulberry32) — same seed, same match. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Probability share of `mine` vs `theirs`, powered so edges bite but never hit 0/1. */
function share(mine: number, theirs: number): number {
  const a = Math.pow(Math.max(1, mine), RATING_EXPONENT);
  const b = Math.pow(Math.max(1, theirs), RATING_EXPONENT);
  return a / (a + b);
}

/** Chance minutes: half the slots in each half, sorted, with breathing room between beats. */
function rollMinutes(count: number, rnd: () => number): number[] {
  const firstHalf = Math.round(count / 2);
  const minutes: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const inFirst = i < firstHalf;
    minutes.push(inFirst ? 2 + Math.floor(rnd() * 41) : 47 + Math.floor(rnd() * 42));
  }
  minutes.sort((a, b) => a - b);
  // Nudge duplicates apart so two beats never share a minute (keeps the feed legible).
  for (let i = 1; i < minutes.length; i += 1) {
    if (minutes[i] <= minutes[i - 1]) minutes[i] = minutes[i - 1] + 1;
  }
  return minutes;
}

/** Weighted pick of the attacker a beat is attributed to (shooters by SHO, never the GK). */
function pickAttacker(cards: SimCard[], rnd: () => number): string {
  const pool = cards.filter((c) => c.position !== 'GK');
  const source = pool.length ? pool : cards;
  if (!source.length) return 'Striker';
  const total = source.reduce((sum, c) => sum + c.stats.sho, 0);
  let roll = rnd() * total;
  for (const c of source) {
    roll -= c.stats.sho;
    if (roll <= 0) return c.name;
  }
  return source[source.length - 1].name;
}

interface Side {
  team: DuelSimTeam;
  cards: SimCard[];
  strength: TeamStrength;
}

/** Resolves one chance slot into a timeline beat (and possibly a goal). */
function resolveChance(attacking: Side, defending: Side, minute: number, rnd: () => number): DuelChanceEvent {
  const player = pickAttacker(attacking.cards, rnd);
  const shotP = Math.min(0.95, 2 * SHOT_BASE * share(attacking.strength.attack, defending.strength.defense));
  if (rnd() >= shotP) {
    const outcome = rnd() < STEAL_SHARE ? ChanceOutcome.Steal : ChanceOutcome.Corner;
    return { simMinute: minute, team: attacking.team, outcome, player };
  }
  const goalP = Math.min(0.9, 2 * GOAL_BASE * share(attacking.strength.attack, defending.strength.keeper));
  if (rnd() < goalP) return { simMinute: minute, team: attacking.team, outcome: ChanceOutcome.Goal, player };
  const outcome = rnd() < SAVE_SHARE ? ChanceOutcome.SavedShot : ChanceOutcome.OffTargetShot;
  return { simMinute: minute, team: attacking.team, outcome, player };
}

/** Pre-rolls the whole match: chance beats + authoritative final score. Deterministic per seed. */
export function simulateDuel(homeCards: SimCard[], awayCards: SimCard[], seed: number): DuelTimeline {
  const rnd = mulberry32(seed);
  const home: Side = { team: DuelSimTeam.Home, cards: homeCards, strength: computeTeamStrength(homeCards) };
  const away: Side = { team: DuelSimTeam.Away, cards: awayCards, strength: computeTeamStrength(awayCards) };

  const count = CHANCES_PER_MATCH - CHANCE_JITTER + Math.floor(rnd() * (CHANCE_JITTER * 2 + 1));
  const minutes = rollMinutes(count, rnd);

  const events: DuelChanceEvent[] = [];
  let homeScore = 0;
  let awayScore = 0;
  for (const minute of minutes) {
    const homeWinsBall = rnd() < share(home.strength.midfield, away.strength.midfield);
    const attacking = homeWinsBall ? home : away;
    const defending = homeWinsBall ? away : home;
    const event = resolveChance(attacking, defending, minute, rnd);
    events.push(event);
    if (event.outcome === ChanceOutcome.Goal) {
      if (event.team === DuelSimTeam.Home) homeScore += 1;
      else awayScore += 1;
    }
  }
  return { events, homeScore, awayScore };
}
