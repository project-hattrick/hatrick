'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { BetStatus } from '@/enums/bet-status.enum';
import { BETTING_MARKETS, BETTING_MATCH_LABEL } from '@/config/betting-markets.config';
import { betService, type ServerBet } from '@/services/bet.service';
import { useAuthStore } from '@/store/auth.store';
import { useBetsStore } from '@/store/bets.store';
import type { Bet } from '@/types/bet';
import type { MarketType } from '@/enums/market-type.enum';
import { queryKeys } from './keys';

/** Once an open hydrated bet is due, let the mock settlement driver resolve it shortly. */
const OPEN_SETTLE_DELAY_MS = 8_000;

/** api BetStatus → front BetStatus (Pending→Open, CashedOut counts as a win). */
function toFrontStatus(status: ServerBet['status']): BetStatus {
  switch (status) {
    case 'Won':
    case 'CashedOut':
      return BetStatus.Won;
    case 'Lost':
      return BetStatus.Lost;
    case 'Void':
      return BetStatus.Void;
    default:
      return BetStatus.Open;
  }
}

/** Rebuild the display label from the odds board (falls back to the raw selection id). */
function labelFor(market: MarketType, selectionId: string): string {
  const def = BETTING_MARKETS.find((m) => m.market === market);
  return def?.selections.find((s) => s.selectionId === selectionId)?.label ?? selectionId;
}

function toBet(sb: ServerBet, now: number): Bet {
  const placedAt = new Date(sb.placedAt).getTime();
  const settledAt = sb.settledAt ? new Date(sb.settledAt).getTime() : null;
  const status = toFrontStatus(sb.status);
  return {
    market: sb.market,
    selectionId: sb.selection,
    label: labelFor(sb.market, sb.selection),
    odds: Number(sb.oddsTaken),
    id: sb.id,
    serverId: sb.id,
    fixtureId: sb.fixtureId,
    matchLabel: BETTING_MATCH_LABEL,
    stake: Number(sb.stake),
    status,
    placedAt,
    settleAt: settledAt ?? (status === BetStatus.Open ? now + OPEN_SETTLE_DELAY_MS : placedAt),
  };
}

/**
 * BOOT hydration for bets — pulls the server ledger when signed in and mirrors it into
 * the bets store (open vs settled), so history follows the account. Mount once.
 */
export function useBetsSession() {
  const isAuthed = useAuthStore((s) => s.status === 'authed');
  const hydrate = useBetsStore((s) => s.hydrate);

  const query = useQuery({
    queryKey: queryKeys.betsSession(),
    queryFn: ({ signal }) => betService.list(signal),
    enabled: isAuthed,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    const now = Date.now();
    const bets = query.data.map((sb) => toBet(sb, now));
    hydrate(
      bets.filter((b) => b.status === BetStatus.Open),
      bets.filter((b) => b.status !== BetStatus.Open),
    );
  }, [query.isSuccess, query.data, hydrate]);

  return query;
}
