import { BetStatus } from '@/enums/bet-status.enum';
import { useBetsStore } from '@/store/bets.store';
import type { Bet } from '@/types/bet';

/** How often the driver checks for bets that are due to settle. */
const TICK_MS = 1_000;

/** Roll a mock outcome — implied probability (1/odds) is the win chance. */
function resolve(bet: Bet): BetStatus {
  return Math.random() < 1 / bet.odds ? BetStatus.Won : BetStatus.Lost;
}

/**
 * Simulated settlement — the mock stand-in for the authoritative `*.after`
 * TxLINE events. Every tick it settles any open bet whose window has elapsed,
 * crediting the payout on a win. Same start/stop contract as startMockCrowd.
 * The backend swap replaces this with a match-event subscription (see betting-markets.config).
 */
export function startMockSettlement(): () => void {
  const timer = setInterval(() => {
    const { open, settle } = useBetsStore.getState();
    const now = Date.now();
    open.filter((bet) => bet.settleAt <= now).forEach((bet) => settle(bet.id, resolve(bet)));
  }, TICK_MS);
  return () => clearInterval(timer);
}
