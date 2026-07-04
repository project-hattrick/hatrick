import { RankTier } from '@/enums/rank-tier.enum';
import { Presence } from '@/enums/presence.enum';
import type { Duelist } from '@/config/matchmaking.config';

/**
 * A full player profile shown in the /duelists directory and public profile pages.
 * Superset of Duelist so any profile can be handed straight to the VS / matchmaking
 * screen without re-mapping. Mock data until profiles come from the API.
 */
export interface PlayerProfile extends Duelist {
  id: string;
  /** URL-safe handle used in /duelists/[username]. */
  username: string;
  presence: Presence;
  bio: string;
  /** ISO date the account was created. */
  joinedAt: string;
}

const PORTRAITS = ['/cards/player-93.png', '/cards/player-green.png', '/cards/player-keeper.png'] as const;

/** The signed-in player (mock — mirrors selfDuelist in matchmaking.config). */
export const selfProfile: PlayerProfile = {
  id: 'you',
  username: 'you',
  name: 'You',
  country: 'BRA',
  tier: RankTier.Gold,
  division: 'II',
  rating: 1420,
  wins: 128,
  losses: 74,
  streak: 'W5',
  portraitSrc: PORTRAITS[1],
  presence: Presence.Online,
  bio: 'Chasing Diamond this season. Always up for a duel.',
  joinedAt: '2026-01-14',
};

export const duelists: PlayerProfile[] = [
  { id: 'd1', username: 'bleuforce', name: 'bleuforce', country: 'FRA', tier: RankTier.Gold, division: 'I', rating: 1447, wins: 210, losses: 150, streak: 'W2', portraitSrc: PORTRAITS[0], presence: Presence.Online, bio: 'Paris. Counter-attacks only.', joinedAt: '2025-11-02' },
  { id: 'd2', username: 'pixelmessi10', name: 'PixelMessi10', country: 'ARG', tier: RankTier.Master, division: 'I', rating: 1712, wins: 512, losses: 190, streak: 'W9', portraitSrc: PORTRAITS[1], presence: Presence.InMatch, bio: 'Left foot, right dreams.', joinedAt: '2025-09-21' },
  { id: 'd3', username: 'golmaster', name: 'GolMaster', country: 'ESP', tier: RankTier.Diamond, division: 'II', rating: 1588, wins: 344, losses: 201, streak: 'L1', portraitSrc: PORTRAITS[2], presence: Presence.Online, bio: 'Tiki-taka enjoyer.', joinedAt: '2025-10-10' },
  { id: 'd4', username: 'hattrick23', name: 'HatTrick23', country: 'ENG', tier: RankTier.Diamond, division: 'III', rating: 1534, wins: 288, losses: 233, streak: 'W3', portraitSrc: PORTRAITS[0], presence: Presence.Offline, bio: 'Three at the back, three up top.', joinedAt: '2025-12-01' },
  { id: 'd5', username: 'kickmaster', name: 'KickMaster', country: 'GER', tier: RankTier.Platinum, division: 'I', rating: 1490, wins: 198, losses: 160, streak: 'W1', portraitSrc: PORTRAITS[1], presence: Presence.Online, bio: 'Gegenpressing every match.', joinedAt: '2026-02-18' },
  { id: 'd6', username: 'samurai_no9', name: 'Samurai No.9', country: 'JPN', tier: RankTier.Platinum, division: 'II', rating: 1462, wins: 176, losses: 149, streak: 'L2', portraitSrc: PORTRAITS[2], presence: Presence.Offline, bio: 'Fast breaks, faster hands.', joinedAt: '2026-01-30' },
  { id: 'd7', username: 'laranja', name: 'Laranja', country: 'NED', tier: RankTier.Gold, division: 'I', rating: 1438, wins: 154, losses: 131, streak: 'W4', portraitSrc: PORTRAITS[0], presence: Presence.Online, bio: 'Total football or nothing.', joinedAt: '2026-03-05' },
  { id: 'd8', username: 'azzurro7', name: 'Azzurro7', country: 'ITA', tier: RankTier.Gold, division: 'III', rating: 1401, wins: 133, losses: 128, streak: 'L1', portraitSrc: PORTRAITS[1], presence: Presence.InMatch, bio: 'Catenaccio, obviously.', joinedAt: '2026-02-02' },
  { id: 'd9', username: 'celeste', name: 'Celeste', country: 'URU', tier: RankTier.Silver, division: 'I', rating: 1355, wins: 121, losses: 130, streak: 'W2', portraitSrc: PORTRAITS[2], presence: Presence.Online, bio: 'Garra charrúa.', joinedAt: '2026-03-22' },
  { id: 'd10', username: 'eltri', name: 'ElTri', country: 'MEX', tier: RankTier.Silver, division: 'II', rating: 1322, wins: 98, losses: 121, streak: 'L3', portraitSrc: PORTRAITS[0], presence: Presence.Offline, bio: 'Cuauhtemiña forever.', joinedAt: '2026-04-01' },
  { id: 'd11', username: 'reddevil', name: 'RedDevil', country: 'BEL', tier: RankTier.Platinum, division: 'III', rating: 1451, wins: 167, losses: 152, streak: 'W6', portraitSrc: PORTRAITS[1], presence: Presence.Online, bio: 'Golden generation, still going.', joinedAt: '2026-01-08' },
  { id: 'd12', username: 'vatreni', name: 'Vatreni', country: 'CRO', tier: RankTier.Diamond, division: 'I', rating: 1601, wins: 301, losses: 178, streak: 'W7', portraitSrc: PORTRAITS[2], presence: Presence.InMatch, bio: 'Checkered and cold-blooded.', joinedAt: '2025-10-25' },
  { id: 'd13', username: 'canarinho', name: 'Canarinho', country: 'BRA', tier: RankTier.Master, division: 'II', rating: 1668, wins: 420, losses: 210, streak: 'W3', portraitSrc: PORTRAITS[0], presence: Presence.Online, bio: 'Jogo bonito or bust.', joinedAt: '2025-08-30' },
  { id: 'd14', username: 'cafeteros', name: 'Cafeteros', country: 'COL', tier: RankTier.Gold, division: 'II', rating: 1428, wins: 149, losses: 137, streak: 'L1', portraitSrc: PORTRAITS[1], presence: Presence.Offline, bio: 'Ritmo y gol.', joinedAt: '2026-02-27' },
  { id: 'd15', username: 'stripes', name: 'Stripes', country: 'USA', tier: RankTier.Silver, division: 'III', rating: 1288, wins: 84, losses: 110, streak: 'W1', portraitSrc: PORTRAITS[2], presence: Presence.Online, bio: 'New to the pitch, quick learner.', joinedAt: '2026-05-11' },
  { id: 'd16', username: 'bronzestart', name: 'BronzeStart', country: 'POR', tier: RankTier.Bronze, division: 'I', rating: 1180, wins: 41, losses: 63, streak: 'L2', portraitSrc: PORTRAITS[0], presence: Presence.Online, bio: 'Grinding up the ladder.', joinedAt: '2026-06-01' },
];

/** Player ids that have already sent the signed-in user a friend request (seed). */
export const seedIncomingIds = ['d3', 'd11'];

/** Player ids that are already friends on first run (seed). */
export const seedFriendIds = ['d1', 'd7'];

/** Tier filter chips for the directory — 'all' plus each tier, config-driven (no switch). */
export interface TierFilter {
  value: RankTier | 'all';
  label: string;
}

export const tierFilters: TierFilter[] = [
  { value: 'all', label: 'All tiers' },
  { value: RankTier.Master, label: 'Master' },
  { value: RankTier.Diamond, label: 'Diamond' },
  { value: RankTier.Platinum, label: 'Platinum' },
  { value: RankTier.Gold, label: 'Gold' },
  { value: RankTier.Silver, label: 'Silver' },
  { value: RankTier.Bronze, label: 'Bronze' },
];
