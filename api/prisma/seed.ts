/**
 * Seeds `card_catalog` from the same pool the front ships in
 * `src/config/{fantasy-cards,pack-pool,duelists}.config.ts`: the 5 fantasy stars
 * (real players) + 16 generated duelist personas. Data is duplicated inline on
 * purpose — apps never cross-import (docs/conventions.md).
 *
 * Run: `npx ts-node prisma/seed.ts` (idempotent — skips if already populated).
 */
import { CardRarity, PlayerPosition, Presence, PrismaClient, RankTier, StoreItemKind, type Prisma } from '@prisma/client';

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

/** Card catalog — gated by count (idempotent; the pool never changes mid-run). */
async function seedCards(): Promise<void> {
  const existing = await prisma.cardCatalog.count();
  if (existing > 0) {
    console.log(`card_catalog already has ${existing} rows — skipping cards.`);
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

// ── Ranking (mirrors src/fantasy/ranking.util.ts) ─────────────────────────────
const TIER_BANDS: Array<{ min: number; tier: RankTier }> = [
  { min: 1800, tier: RankTier.Master },
  { min: 1650, tier: RankTier.Diamond },
  { min: 1500, tier: RankTier.Platinum },
  { min: 1350, tier: RankTier.Gold },
  { min: 1200, tier: RankTier.Silver },
  { min: 0, tier: RankTier.Bronze },
];
function rankFromMmr(mmr: number): { tier: RankTier; division: string } {
  const band = TIER_BANDS.find((b) => mmr >= b.min) ?? TIER_BANDS[TIER_BANDS.length - 1];
  const offset = mmr - band.min;
  return { tier: band.tier, division: offset >= 100 ? 'I' : offset >= 50 ? 'II' : 'III' };
}

/**
 * The 16 duelists as real User rows (vs-CPU personas). Idempotent upsert by a
 * deterministic `npc:<username>` placeholder wallet — stats derived from the same
 * hash + MMR the cards use, so the directory + public profiles are backed by real data.
 */
async function seedDuelistUsers(): Promise<void> {
  for (const d of duelistSeeds) {
    const h = hash(d.username);
    const wins = 80 + (h % 320);
    const losses = 40 + ((h >> 5) % 220);
    const streak = `${h % 2 === 0 ? 'W' : 'L'}${1 + (h % 8)}`;
    const { tier, division } = rankFromMmr(d.rating);
    const stats = {
      mmr: d.rating,
      tier,
      division,
      wins,
      losses,
      streak,
      country: d.country,
      portraitSrc: d.portraitSrc,
      presence: Presence.Online,
    };
    await prisma.user.upsert({
      where: { walletAddress: `npc:${d.username}` },
      update: stats,
      create: { walletAddress: `npc:${d.username}`, username: d.username, displayName: d.name, ...stats },
    });
  }
  console.log(`Seeded ${duelistSeeds.length} duelist users.`);
}

/**
 * Give the signed-in demo account a populated profile: any real (non-persona) user
 * still at defaults (mmr 1200, 0-0) gets a starter Gold-II record. Idempotent — once
 * bumped (or once the user has actually played), it's left alone.
 */
async function backfillCurrentUserStats(): Promise<void> {
  const fresh = await prisma.user.findMany({
    where: { mmr: 1200, wins: 0, losses: 0, walletAddress: { not: { startsWith: 'npc:' } } },
  });
  if (!fresh.length) return;
  const mmr = 1420;
  const { tier, division } = rankFromMmr(mmr);
  for (const u of fresh) {
    await prisma.user.update({
      where: { id: u.id },
      data: { mmr, tier, division, wins: 128, losses: 74, streak: 'W5' },
    });
  }
  console.log(`Backfilled starter stats for ${fresh.length} real user(s).`);
}

// ── Store catalog — limited-stock items (prices in coins; display SOL = /100k) ─
const storeItems: Array<{ slug: string; kind: StoreItemKind; name: string; price: number; stock: number }> = [
  { slug: 'legendary-pack', kind: StoreItemKind.Pack, name: 'Legendary Pack', price: 200_000, stock: 12 },
  { slug: 'pro-pack', kind: StoreItemKind.Pack, name: 'Pro Pack', price: 120_000, stock: 25 },
  { slug: 'starter-pack', kind: StoreItemKind.Pack, name: 'Starter Pack', price: 50_000, stock: 40 },
  { slug: 'limited-bundle', kind: StoreItemKind.Bundle, name: 'Limited Bundle', price: 350_000, stock: 8 },
  { slug: 'midfield-bundle', kind: StoreItemKind.Bundle, name: 'Midfield Bundle', price: 250_000, stock: 15 },
  { slug: 'card-mbappe', kind: StoreItemKind.Card, name: 'Mbappé', price: 295_000, stock: 3 },
  { slug: 'card-haaland', kind: StoreItemKind.Card, name: 'Haaland', price: 245_000, stock: 5 },
  { slug: 'card-messi', kind: StoreItemKind.Card, name: 'Messi', price: 235_000, stock: 5 },
  { slug: 'card-vini', kind: StoreItemKind.Card, name: 'Vini Jr', price: 215_000, stock: 8 },
  { slug: 'card-bellingham', kind: StoreItemKind.Card, name: 'Bellingham', price: 185_000, stock: 10 },
];

/** Store items — upsert by slug so new items land without resetting live stock. */
async function seedStoreItems(): Promise<void> {
  for (const item of storeItems) {
    await prisma.storeItem.upsert({
      where: { slug: item.slug },
      update: {}, // never touch live stock on re-seed
      create: item,
    });
  }
  console.log(`Seeded ${storeItems.length} store items.`);
}

async function main(): Promise<void> {
  await seedCards();
  await seedDuelistUsers();
  await backfillCurrentUserStats();
  await seedStoreItems();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
