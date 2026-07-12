import { BetStatus } from '@/enums/bet-status.enum';
import { GameState } from '@/enums/game-state.enum';
import { MarketType } from '@/enums/market-type.enum';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { replayService } from '@/services/replay.service';
import { isBackendSession } from '@/services/session-mode';
import { useBetsStore } from '@/store/bets.store';
import { useMatchStore } from '@/store/match.store';
import type { Bet } from '@/types/bet';
import type { MatchScore } from '@/types/match';

/** How often the driver checks for bets that are due to settle. */
const TICK_MS = 1_000;
/** How often we re-ask the snapshot whether an off-screen real fixture has finished. */
const SNAPSHOT_RETRY_MS = 60_000;

/** Roll a mock outcome — implied probability (1/odds) is the win chance. */
function resolve(bet: Bet): BetStatus {
  return Math.random() < 1 / bet.odds ? BetStatus.Won : BetStatus.Lost;
}

/**
 * Settle by the REAL final score — null for markets the score can't verify (those fall to the roll).
 * Standard 1X2 / Over-Under semantics settle on regulation time (90'), not extra time, so the
 * regulation score wins whenever the feed broke periods down (knockout games can go to ET).
 */
function resolveByScore(bet: Bet, score: MatchScore, regulation?: MatchScore | null): BetStatus | null {
  const basis = regulation ?? score;
  if (bet.market === MarketType.MatchResult) {
    const winner = basis.home > basis.away ? 'home' : basis.away > basis.home ? 'away' : 'draw';
    return bet.selectionId === winner ? BetStatus.Won : BetStatus.Lost;
  }
  if (bet.market === MarketType.TotalGoals) {
    const total = basis.home + basis.away;
    if (bet.selectionId === 'over') return total > 2.5 ? BetStatus.Won : BetStatus.Lost;
    if (bet.selectionId === 'under') return total < 2.5 ? BetStatus.Won : BetStatus.Lost;
  }
  return null;
}

/**
 * Bet settlement driver. Three paths:
 * - Mock-fixture bets (demo): quick roll a few seconds after placing, as always.
 * - Real fixture ON screen: hold until the match reaches full-time, then settle by the real score.
 * - Real fixture OFF screen (user switched away / reloaded later): once the bet is due, poll the
 *   authoritative score snapshot and settle when the fixture reports finished.
 *
 * Backend sessions are exempt from the two real-fixture paths: the server settles those
 * on `match-end.after` and useUserChannel reconciles by refetching the bets ledger.
 */
export function startMockSettlement(): () => void {
  const pendingLookups = new Set<number>();
  const lastLookup = new Map<number, number>();

  const settleFixtureFromSnapshot = (fixtureId: number) => {
    const now = Date.now();
    if (pendingLookups.has(fixtureId) || now - (lastLookup.get(fixtureId) ?? 0) < SNAPSHOT_RETRY_MS) return;
    pendingLookups.add(fixtureId);
    lastLookup.set(fixtureId, now);
    replayService
      .getScore(fixtureId)
      .then((snap) => {
        if (!snap.finished) return;
        const { open, settle } = useBetsStore.getState();
        const score: MatchScore = { home: snap.home, away: snap.away };
        const regulation: MatchScore | null =
          snap.regulationHome !== undefined || snap.regulationAway !== undefined
            ? { home: snap.regulationHome ?? 0, away: snap.regulationAway ?? 0 }
            : null;
        open
          .filter((bet) => bet.fixtureId === fixtureId)
          .forEach((bet) => settle(bet.id, resolveByScore(bet, score, regulation) ?? resolve(bet)));
      })
      .catch(() => {
        /* snapshot unavailable — retried on the next window */
      })
      .finally(() => pendingLookups.delete(fixtureId));
  };

  const timer = setInterval(() => {
    const { open, settle } = useBetsStore.getState();
    if (open.length === 0) return;
    const now = Date.now();
    const { match, isReplay, regulationScore } = useMatchStore.getState();
    const liveFixtureId = match && !isReplay ? match.fixtureId : null;
    const liveEnded = match?.gameState === GameState.FullTime;

    // Real fixtures are settled server-side when signed in against the backend.
    const serverSettles = isBackendSession();

    for (const bet of open) {
      if (bet.fixtureId === MOCK_FIXTURE_ID) {
        if (bet.settleAt <= now) settle(bet.id, resolve(bet));
        continue;
      }
      if (serverSettles) continue;
      if (bet.fixtureId === liveFixtureId) {
        if (liveEnded && match)
          settle(bet.id, resolveByScore(bet, match.score, regulationScore) ?? resolve(bet));
        continue; // real match still running — hold
      }
      if (bet.settleAt <= now) settleFixtureFromSnapshot(bet.fixtureId);
    }
  }, TICK_MS);
  return () => clearInterval(timer);
}
