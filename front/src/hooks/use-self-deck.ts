'use client';

import { useFantasyStore } from '@/store/fantasy.store';
import { toDeckCards } from '@/lib/deck';
import { userCards } from '@/config/fantasy-cards.config';
import type { CollectionCard } from '@/services/fantasy.service';
import type { DeckCard } from '@/components/fantasy/mini-holo-card';

/** The player's fielded squad as deck cards; falls back to their collection, then demo cards. */
export function useSelfDeck(): DeckCard[] {
  const squad = useFantasyStore((s) => s.squad);
  const collection = useFantasyStore((s) => s.collection);
  const owned = squad.map((i) => collection[i]).filter((c): c is CollectionCard => Boolean(c));
  if (owned.length) return toDeckCards(owned);
  if (collection.length) return toDeckCards(collection.slice(0, 11));
  return userCards;
}
