import type { PackCard } from '@/config/pack-pool.config';
import { statOrder } from '@/config/fantasy-cards.config';
import { endpoints } from './endpoints';
import { api } from './http';

/** A collection card carries its server-side owned copy id (drives squad/duel persistence). */
export type CollectionCard = PackCard & { ownedCardId?: string };

/** Pack tiers (mirror of the api Prisma PackType). */
export enum PackType {
  Welcome = 'Welcome',
  Standard = 'Standard',
  Premium = 'Premium',
  Special = 'Special',
}

/** Mirror of the api CardDto. */
interface CardDto {
  ownedCardId?: string;
  cardId: string;
  name: string;
  rating: number;
  position: string;
  rarity: string;
  stats: Record<string, number>;
  country: string | null;
  code: string | null;
  flag: string | null;
  holoColors: string[] | null;
  portraitSrc: string | null;
}

interface PackResult {
  cards: CardDto[];
  balance: string;
}

export interface ServerSquad {
  id: string;
  formation: string;
  slots: Array<{ slotIndex: number; position: string; card: CardDto }>;
}

/** Server card → the front's holo `PackCard` shape (stats reordered to the card layout). */
export function toPackCard(dto: CardDto): CollectionCard {
  return {
    name: dto.name,
    number: dto.rating,
    flag: dto.flag ?? undefined,
    holoColors: (dto.holoColors ?? undefined) as [string, string, string] | undefined,
    portraitSrc: dto.portraitSrc ?? undefined,
    stats: statOrder.map(([label, key]) => ({ label, value: dto.stats[key] ?? 0 })),
    ownedCardId: dto.ownedCardId,
    code: dto.code ?? undefined,
    position: dto.position,
  };
}

/**
 * Fantasy persistence seam (guarded, self-scoped via the session cookie). Packs are
 * drawn server-side; the collection and active XI hydrate from the server on login.
 */
export const fantasyService = {
  collection: async (signal?: AbortSignal): Promise<CollectionCard[]> =>
    (await api.get<CardDto[]>(endpoints.fantasy.collection, signal)).map(toPackCard),

  openPack: async (type: PackType): Promise<{ cards: CollectionCard[]; balance: string }> => {
    const res = await api.post<PackResult>(endpoints.fantasy.openPack, { type });
    return { cards: res.cards.map(toPackCard), balance: res.balance };
  },

  getSquad: (signal?: AbortSignal): Promise<ServerSquad | null> =>
    api.get<ServerSquad | null>(endpoints.fantasy.squad, signal),

  saveSquad: (formation: string, ownedCardIds: string[]): Promise<ServerSquad> =>
    api.put<ServerSquad>(endpoints.fantasy.squad, { formation, ownedCardIds }),
};

/** Mirror of the api DuelResult enum values (front duel-result enum uses lowercase). */
export type DuelResultValue = 'Win' | 'Loss' | 'Draw';

interface DuelResultResponse {
  duel: { id: string };
  balance: string;
}

export interface MatchmakingResultResponse {
  status: 'queued' | 'matched';
  duelId?: string;
}

/** A second player joining an open PvP duel with their own XI. */
export interface JoinDuelPayload {
  formation: string;
  ownedCardIds: string[];
}

export interface CreateDuelPayload {
  stake: number;
  opponentName?: string;
  /** Real user id for PvP challenges — omit for vs-CPU. */
  opponentUserId?: string;
  mode: 'Ranked' | 'Friendly';
  formation: string;
  ownedCardIds: string[];
  /** Open as a real 1v1 challenge (Pending) instead of vs-CPU; arms the on-chain escrow on join. */
  pvp?: boolean;
}

/** Minimal player shape returned inside DuelDetailDto. */
export interface DuelPlayerDto {
  id: string;
  displayName: string | null;
  username: string | null;
  country: string | null;
  avatarUrl: string | null;
  mmr: number;
}

/** Lineup shape inside DuelDetailDto. */
export interface DuelLineupDto {
  formation: string;
  ownedCardIds: string[];
  opponentName: string | null;
}

/**
 * Mirror of the api DuelDetailDto (GET /duels/:id).
 * Used by the host waiting screen and the joiner's join page.
 */
export interface DuelDetailDto {
  id: string;
  mode: string;
  status: string;
  stake: string;
  hostScore: number;
  guestScore: number;
  winnerId: string | null;
  hostResult: DuelResultValue | null;
  mmrDelta: number | null;
  createdAt: string;
  finishedAt: string | null;
  host: DuelPlayerDto;
  guest: DuelPlayerDto | null;
  hostLineup: DuelLineupDto | null;
  guestLineup: DuelLineupDto | null;
}

/** A settled/live duel row from the api (mirror of the api DuelDto). */
export interface DuelHistoryDto {
  id: string;
  mode: string;
  status: string;
  stake: string;
  hostScore: number;
  guestScore: number;
  winnerId: string | null;
  hostResult: DuelResultValue | null;
  opponentName: string | null;
  mmrDelta: number | null;
  createdAt: string;
  finishedAt: string | null;
}

export const duelService = {
  create: (payload: CreateDuelPayload): Promise<DuelResultResponse> =>
    api.post<DuelResultResponse>(endpoints.duels.base, payload),

  enterMatchmaking: (payload: JoinDuelPayload): Promise<MatchmakingResultResponse> =>
    api.post<MatchmakingResultResponse>(endpoints.duels.matchmakingEnter, payload),

  leaveMatchmaking: (): Promise<void> =>
    api.del<void>(endpoints.duels.matchmakingLeave),

  /** Fetch a single duel by id — used by the host waiting screen and join page. */
  get: (id: string, signal?: AbortSignal): Promise<DuelDetailDto> =>
    api.get<DuelDetailDto>(endpoints.duels.detail(id), signal),

  /** Join an open PvP duel; the api arms the on-chain escrow when both wallets are known. */
  join: (id: string, payload: JoinDuelPayload): Promise<DuelResultResponse> =>
    api.post<DuelResultResponse>(endpoints.duels.join(id), payload),

  settle: (
    id: string,
    payload: { hostScore: number; guestScore: number; result: DuelResultValue },
  ): Promise<DuelResultResponse> =>
    api.post<DuelResultResponse>(endpoints.duels.settle(id), payload),

  /** The signed-in player's duel history (self-scoped, newest first). */
  list: (signal?: AbortSignal): Promise<DuelHistoryDto[]> =>
    api.get<DuelHistoryDto[]>(endpoints.duels.base, signal),
};
