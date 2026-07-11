'use client';

import { useMemo } from 'react';

import { BETTING_MARKETS, type MarketDef } from '@/config/betting-markets.config';
import { useMatchStore } from '@/store/match.store';
import { useOddsStore } from '@/store/odds.store';

/**
 * The odds board with live TxLINE prices folded in: markets/selections the wire covers show the
 * streamed odds, everything else keeps the static config fallback. Selections keep their ids, so
 * bet placement/settlement is unchanged — only the price the pick carries moves.
 */
export function useLiveMarkets(): MarketDef[] {
  const fixtureId = useMatchStore((state) => state.match?.fixtureId ?? null);
  const book = useOddsStore((state) => (fixtureId != null && state.fixtureId === fixtureId ? state.book : null));

  return useMemo(() => {
    if (!book) return BETTING_MARKETS;
    return BETTING_MARKETS.map((def) => {
      const live = book[def.market];
      if (!live) return def;
      return {
        ...def,
        selections: def.selections.map((selection) =>
          live[selection.selectionId] != null ? { ...selection, odds: live[selection.selectionId] } : selection,
        ),
      };
    });
  }, [book]);
}
