import { create } from 'zustand';

import { mapLiveOdds, type LiveOddsContext } from '@/lib/live-odds';
import type { MarketType } from '@/enums/market-type.enum';
import type { OddsSnapshotItem } from '@/services/replay.service';
import type { OddsEventPayload } from '@/types/match';

/** market → selectionId → decimal odds, as last seen on the wire. */
type LiveOddsBook = Partial<Record<MarketType, Record<string, number>>>;

interface OddsStore {
  /** Fixture the book belongs to — updates for any other fixture are dropped. */
  fixtureId: number | null;
  book: LiveOddsBook;
  /** Point the book at a fixture (clearing it); null clears everything. */
  reset: (fixtureId: number | null) => void;
  /** Seed the book from the REST snapshot (latest odds per bookmaker/market). */
  baseline: (fixtureId: number, items: OddsSnapshotItem[]) => void;
  /** Fold one live `odds.update` into the book. */
  applyUpdate: (payload: OddsEventPayload) => void;
}

function fold(
  book: LiveOddsBook,
  superOddsType: string,
  priceNames: string[],
  prices: number[],
  context: LiveOddsContext,
): LiveOddsBook {
  const mapped = mapLiveOdds(superOddsType, priceNames, prices, context);
  if (!mapped) return book;
  return { ...book, [mapped.market]: { ...book[mapped.market], ...mapped.odds } };
}

/** Live odds book for the current match, fed by the odds snapshot + `odds.update` stream. */
export const useOddsStore = create<OddsStore>((set) => ({
  fixtureId: null,
  book: {},
  reset: (fixtureId) => set({ fixtureId, book: {} }),
  baseline: (fixtureId, items) =>
    set((state) => {
      if (state.fixtureId !== fixtureId) return {};
      // Oldest first so the most recent message per market wins the fold.
      const ordered = [...items].sort((a, b) => a.Ts - b.Ts);
      let book: LiveOddsBook = {};
      for (const item of ordered) {
        book = fold(book, item.SuperOddsType, item.PriceNames ?? [], item.Prices ?? [], {
          marketPeriod: item.MarketPeriod,
          marketParameters: item.MarketParameters,
        });
      }
      return { book };
    }),
  applyUpdate: (payload) =>
    set((state) => {
      if (state.fixtureId == null || payload.fixtureId !== state.fixtureId) return {};
      const book = fold(state.book, payload.superOddsType, payload.priceNames, payload.prices, {
        marketPeriod: payload.marketPeriod,
        marketParameters: payload.marketParameters,
      });
      return book === state.book ? {} : { book };
    }),
}));
