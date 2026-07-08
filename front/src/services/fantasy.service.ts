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

export interface CreateDuelPayload {
  stake: number;
  opponentName?: string;
  mode: 'Ranked' | 'Friendly';
  formation: string;
  ownedCardIds: string[];
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

  settle: (
    id: string,
    payload: { hostScore: number; guestScore: number; result: DuelResultValue },
  ): Promise<DuelResultResponse> =>
    api.post<DuelResultResponse>(endpoints.duels.settle(id), payload),

  /** The signed-in player's duel history (self-scoped, newest first). */
  list: (signal?: AbortSignal): Promise<DuelHistoryDto[]> =>
    api.get<DuelHistoryDto[]>(endpoints.duels.base, signal),
};
