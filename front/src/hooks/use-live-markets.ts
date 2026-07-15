'use client';

import { useMemo } from 'react';

import { BETTING_MARKETS, type MarketDef } from '@/config/betting-markets.config';
import { MarketType } from '@/enums/market-type.enum';
import { teamPlayerLabel } from '@/lib/player-identity';
import { useMatchLineups, useMatchStore } from '@/store/match.store';
import { useOddsStore } from '@/store/odds.store';
import type { BetSelection } from '@/types/bet';
import type { LineupsBySide, LineupSlot, LiveMatch, TeamInfo } from '@/types/match';

const SCORER_ODDS = [2.7, 3.1, 3.6, 4.2, 5.0, 6.0];

function roleRank(slot: LineupSlot): number {
  if (slot.positionId === 37) return 0;
  if (slot.positionId === 36) return 1;
  if (slot.positionId === 35) return 2;
  if (slot.positionId === 34) return 4;
  return 3;
}

function selectionFromSlot(slot: LineupSlot, team: TeamInfo, index: number): BetSelection {
  const shirt = slot.shirt ?? ((index % 11) + 1);
  return {
    market: MarketType.PlayerToScore,
    selectionId: `p-${slot.playerId}`,
    label: slot.name ?? teamPlayerLabel(team.code, shirt),
    odds: SCORER_ODDS[index] ?? 6.5,
  };
}

function scorerSelections(match: LiveMatch | null, lineups: LineupsBySide | null): BetSelection[] {
  if (!match) return [];
  const realSelections = lineups
    ? [
        ...lineups.home.map((slot) => ({ slot, team: match.home })),
        ...lineups.away.map((slot) => ({ slot, team: match.away })),
      ]
        .sort((a, b) => {
          const starterDelta = Number(b.slot.starter ?? false) - Number(a.slot.starter ?? false);
          return starterDelta || roleRank(a.slot) - roleRank(b.slot);
        })
        .filter(({ slot }) => slot.positionId !== 34)
        .slice(0, 6)
        .map(({ slot, team }, index) => selectionFromSlot(slot, team, index))
    : [];
  if (realSelections.length >= 3) return realSelections;
  const fallback = [
    { team: match.home, shirt: 9 },
    { team: match.away, shirt: 9 },
    { team: match.home, shirt: 10 },
    { team: match.away, shirt: 10 },
    { team: match.home, shirt: 11 },
    { team: match.away, shirt: 11 },
  ];
  return fallback.map(({ team, shirt }, index) => ({
    market: MarketType.PlayerToScore,
    selectionId: `fallback-${team.side}-${shirt}`,
    label: teamPlayerLabel(team.code, shirt),
    odds: SCORER_ODDS[index] ?? 6.5,
  }));
}

/**
 * The odds board with live TxLINE prices folded in: markets/selections the wire covers show the
 * streamed odds, everything else keeps the static config fallback. Selections keep their ids, so
 * bet placement/settlement is unchanged — only the price the pick carries moves.
 */
export function useLiveMarkets(): MarketDef[] {
  const match = useMatchStore((state) => state.match);
  const fixtureId = match?.fixtureId ?? null;
  const lineups = useMatchLineups();
  const book = useOddsStore((state) => (fixtureId != null && state.fixtureId === fixtureId ? state.book : null));

  return useMemo(() => {
    const markets = BETTING_MARKETS.map((def) =>
      def.market === MarketType.PlayerToScore ? { ...def, selections: scorerSelections(match, lineups) } : def,
    );
    if (!book) return markets;
    return markets.map((def) => {
      const live = book[def.market];
      if (!live) return def;
      return {
        ...def,
        selections: def.selections.map((selection) =>
          live[selection.selectionId] != null ? { ...selection, odds: live[selection.selectionId] } : selection,
        ),
      };
    });
  }, [book, lineups, match]);
}
