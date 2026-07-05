/**
 * Seeds `card_catalog` from the same pool the front ships in
 * `src/config/{fantasy-cards,pack-pool,duelists}.config.ts`: the 5 fantasy stars
 * (real players) + 16 generated duelist personas. Data is duplicated inline on
 * purpose — apps never cross-import (docs/conventions.md).
 *
 * Run: `npx ts-node prisma/seed.ts` (idempotent — skips if already populated).
 */
import { CardRarity, PlayerPosition, PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type Stats = { pac: number; sho: number; pas: number; dri: number; def: number; phy: number };

interface SeedCard {
  name: string;
  position: PlayerPosition;
  rating: number;
  stats: Stats;
  country?: string;
  code?: string;
  flag?: string;
  holoColors?: [string, string, string];
  portraitSrc?: string;
  isPersona: boolean;
}

/** Rating → explicit rarity tier (was implicit in rating on the front). */
function rarityFor(rating: number): CardRarity {
  if (rating >= 95) return CardRarity.Icon;
  if (rating >= 90) return CardRarity.Legendary;
  if (rating >= 84) return CardRarity.Epic;
  if (rating >= 75) return CardRarity.Rare;
  return CardRarity.Common;
}

// ── Fantasy stars (real players) — from fantasy-cards.config.ts ───────────────
const stars: SeedCard[] = [
  { name: 'Haaland', position: PlayerPosition.ST, rating: 96, country: 'NOR', code: 'no', flag: '🇳🇴', holoColors: ['#ba0c2f', '#ffffff', '#00205b'], portraitSrc: '/cards/player-93.png', stats: { pac: 94, sho: 96, pas: 88, dri: 80, def: 45, phy: 94 }, isPersona: false },
  { name: 'Mbappé', position: PlayerPosition.ST, rating: 97, country: 'FRA', code: 'fr', flag: '🇫🇷', holoColors: ['#0055a4', '#ffffff', '#ef4135'], portraitSrc: '/cards/player-green.png', stats: { pac: 99, sho: 94, pas: 85, dri: 95, def: 40, phy: 82 }, isPersona: false },
  { name: 'Messi', position: PlayerPosition.RW, rating: 95, country: 'ARG', code: 'ar', flag: '🇦🇷', holoColors: ['#74acdf', '#ffffff', '#f6b40e'], portraitSrc: '/cards/player-keeper.png', stats: { pac: 88, sho: 92, pas: 94, dri: 96, def: 38, phy: 70 }, isPersona: false },
  { name: 'Bellingham', position: PlayerPosition.CM, rating: 92, country: 'ENG', code: 'gb-eng', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', holoColors: ['#ce1124', '#ffffff', '#ce1124'], portraitSrc: '/cards/player-green.png', stats: { pac: 84, sho: 86, pas: 88, dri: 90, def: 78, phy: 86 }, isPersona: false },
  { name: 'Vini Jr', position: PlayerPosition.LW, rating: 94, country: 'BRA', code: 'br', flag: '🇧🇷', holoColors: ['#009739', '#fedd00', '#012169'], portraitSrc: '/cards/player-93.png', stats: { pac: 97, sho: 88, pas: 82, dri: 95, def: 34, phy: 76 }, isPersona: false },
];

// ── Duelist personas — generated deterministically (mirrors pack-pool.config.ts)
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

/** Deterministic per-name hash (matches the front so stats line up). */
const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const clampStat = (v: number): number => Math.max(48, Math.min(99, v));
const ratingFor = (mmr: number): number => Math.max(65, Math.min(97, Math.round(mmr / 17.8)));

/** Outfield roles cycled by hash — personas have no fixed position on the front. */
const OUTFIELD: PlayerPosition[] = [
  PlayerPosition.ST, PlayerPosition.RW, PlayerPosition.LW, PlayerPosition.CAM,
  PlayerPosition.CM, PlayerPosition.CDM, PlayerPosition.CB, PlayerPosition.RB, PlayerPosition.LB,
];

const duelistSeeds: Array<{ name: string; username: string; country: string; rating: number; portraitSrc: string }> = [
  { name: 'bleuforce', username: 'bleuforce', country: 'FRA', rating: 1447, portraitSrc: '/personas/p07.png' },
  { name: 'PixelMessi10', username: 'pixelmessi10', country: 'ARG', rating: 1712, portraitSrc: '/personas/p05.png' },
  { name: 'GolMaster', username: 'golmaster', country: 'ESP', rating: 1588, portraitSrc: '/personas/p03.png' },
  { name: 'HatTrick23', username: 'hattrick23', country: 'ENG', rating: 1534, portraitSrc: '/personas/p04.png' },
  { name: 'KickMaster', username: 'kickmaster', country: 'GER', rating: 1490, portraitSrc: '/personas/p11.png' },
  { name: 'Samurai No.9', username: 'samurai_no9', country: 'JPN', rating: 1462, portraitSrc: '/personas/p08.png' },
  { name: 'Laranja', username: 'laranja', country: 'NED', rating: 1438, portraitSrc: '/personas/p10.png' },
  { name: 'Azzurro7', username: 'azzurro7', country: 'ITA', rating: 1401, portraitSrc: '/personas/p02.png' },
  { name: 'Celeste', username: 'celeste', country: 'URU', rating: 1355, portraitSrc: '/personas/p06.png' },
  { name: 'ElTri', username: 'eltri', country: 'MEX', rating: 1322, portraitSrc: '/personas/p09.png' },
  { name: 'RedDevil', username: 'reddevil', country: 'BEL', rating: 1451, portraitSrc: '/personas/p04.png' },
  { name: 'Vatreni', username: 'vatreni', country: 'CRO', rating: 1601, portraitSrc: '/personas/p05.png' },
  { name: 'Canarinho', username: 'canarinho', country: 'BRA', rating: 1668, portraitSrc: '/personas/p06.png' },
  { name: 'Cafeteros', username: 'cafeteros', country: 'COL', rating: 1428, portraitSrc: '/personas/p03.png' },
  { name: 'Stripes', username: 'stripes', country: 'USA', rating: 1288, portraitSrc: '/personas/p07.png' },
  { name: 'BronzeStart', username: 'bronzestart', country: 'POR', rating: 1180, portraitSrc: '/personas/p11.png' },
];

const STAT_KEYS: Array<keyof Stats> = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];

const personas: SeedCard[] = duelistSeeds.map((d) => {
  const h = hash(d.username);
  const rating = ratingFor(d.rating);
  const stats = STAT_KEYS.reduce((acc, key, i) => {
    acc[key] = clampStat(rating - 9 + ((h >> (i * 3)) % 16));
    return acc;
  }, {} as Stats);
  const nation = NATION[d.country];
  return {
    name: d.name,
    position: OUTFIELD[h % OUTFIELD.length],
    rating,
    stats,
    country: d.country,
    flag: nation?.flag,
    holoColors: nation?.colors,
    portraitSrc: d.portraitSrc,
    isPersona: true,
  };
});

async function main(): Promise<void> {
  const existing = await prisma.cardCatalog.count();
  if (existing > 0) {
    console.log(`card_catalog already has ${existing} rows — skipping seed.`);
    return;
  }

  const all = [...stars, ...personas];
  const data: Prisma.CardCatalogCreateManyInput[] = all.map((c) => ({
    name: c.name,
    position: c.position,
    rating: c.rating,
    rarity: rarityFor(c.rating),
    stats: c.stats as Prisma.InputJsonValue,
    country: c.country ?? null,
    code: c.code ?? null,
    flag: c.flag ?? null,
    holoColors: (c.holoColors ?? undefined) as Prisma.InputJsonValue | undefined,
    portraitSrc: c.portraitSrc ?? null,
    isPersona: c.isPersona,
  }));

  const { count } = await prisma.cardCatalog.createMany({ data });
  console.log(`Seeded ${count} cards (${stars.length} stars + ${personas.length} personas).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
