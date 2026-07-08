import type { CollectionCard } from '@/services/fantasy.service';
import type { DeckCard } from '@/components/fantasy/mini-holo-card';
import { DEFAULT_SELF_PORTRAIT } from '@/lib/avatar';

const FALLBACK_HOLO: [string, string, string] = ['#94A3B8', '#E2E8F0', '#64748B'];

/** Owned collection cards (a fielded squad) → the minimal deck-card shape for the arena side rail. */
export const toDeckCards = (cards: CollectionCard[]): DeckCard[] =>
  cards.map((c, i) => ({
    id: c.ownedCardId ?? `${c.name}-${i}`,
    name: c.name,
    rating: c.number ?? 0,
    position: c.position ?? '',
    code: c.code ?? '',
    holoColors: c.holoColors ?? FALLBACK_HOLO,
    portraitSrc: c.portraitSrc ?? DEFAULT_SELF_PORTRAIT,
  }));
