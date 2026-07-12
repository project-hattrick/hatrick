'use client';

import { useEffect, useRef } from 'react';

import { MarketType } from '@/enums/market-type.enum';
import { BETTING_MARKETS } from '@/config/betting-markets.config';
import { duelists } from '@/config/duelists.config';
import { recapMatch } from '@/config/recap-match.config';
import { useSelfIdentity } from '@/hooks/use-self-identity';
import { useAuthStore } from '@/store/auth.store';
import { useBetsStore } from '@/store/bets.store';
import { useMatchStore } from '@/store/match.store';
import { useRoomPicksStore, type RoomPick } from '@/store/room-picks.store';
import type { BetSelection } from '@/types/bet';

/**
 * The home hero's PUBLIC picks driver — the landing-page counterpart of
 * `useRoomPicksDriver`. A private room relays each member's REAL bet over the
 * socket; the global live view has no room, so the ambient stream of bettors is
 * always simulated from the duelist roster (a lively public book), while the
 * signed-in user's own real bets still surface as "You". Writes to the shared
 * `useRoomPicksStore`, so RoomSideBackers / RoomPickToast light up unchanged.
 */

/** Simulated pick cadence — lively but not spammy. */
const MIN_GAP_MS = 7_000;
const MAX_GAP_MS = 16_000;
const SEED_DELAYS_MS = [2_000, 5_500, 9_000];
/** Share of fake picks that go to the featured Match Result market. */
const MATCH_RESULT_BIAS = 0.6;
/** Don't repeat any of the last N fake pickers. */
const RECENT_PICKERS = 4;

interface FakePicker {
  userId: string;
  name: string;
  avatarSrc: string;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

/** "Argentina" → "Argentina to win"; keep other labels ("Draw", "Over 2.5") as picked. */
function pickLabel(selection: BetSelection, teamName: string | null): string {
  if (selection.market === MarketType.MatchResult && teamName) return `${teamName} to win`;
  if (selection.market === MarketType.NextGoal && teamName) return `${teamName} next goal`;
  return selection.label;
}

/** Live team name for home/away selections, null otherwise (recap fallback like useDisplayMatch). */
function teamNameFor(selectionId: string): string | null {
  const match = useMatchStore.getState().match ?? recapMatch;
  if (selectionId === 'home') return match.home.name;
  if (selectionId === 'away') return match.away.name;
  return null;
}

/** Weighted Match Result side: implied probability (1/odds) nudged toward the leading team. */
function weightedResultSelection(): BetSelection {
  const def = BETTING_MARKETS.find((d) => d.market === MarketType.MatchResult);
  const selections = def?.selections ?? [];
  const score = useMatchStore.getState().match?.score;
  const weights = selections.map((sel) => {
    let weight = 1 / sel.odds;
    if (score && sel.selectionId === 'home' && score.home > score.away) weight *= 1.6;
    if (score && sel.selectionId === 'away' && score.away > score.home) weight *= 1.6;
    return weight;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < selections.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return selections[i];
  }
  return selections[selections.length - 1];
}

function randomSelection(): BetSelection {
  if (Math.random() < MATCH_RESULT_BIAS) return weightedResultSelection();
  const others = BETTING_MARKETS.filter((d) => d.market !== MarketType.MatchResult);
  const def = others[Math.floor(Math.random() * others.length)];
  return def.selections[Math.floor(Math.random() * def.selections.length)];
}

/** Public book of bettors — the duelist roster, all with real portraits. */
function pickerPool(): FakePicker[] {
  return duelists.map((d) => ({ userId: d.id, name: d.name, avatarSrc: d.portraitSrc }));
}

/**
 * Drives the home hero's public picks layer: the signed-in user's REAL bets become
 * picks instantly (styled as "You"), and a simulated global crowd of bettors keeps
 * placing picks on a lively cadence so the side-backers + pick toast always feel alive.
 */
export function useGlobalPicksDriver(): void {
  const self = useSelfIdentity();
  const selfRef = useRef(self);
  useEffect(() => {
    selfRef.current = self;
  }, [self]);

  useEffect(() => {
    const addPick = (pick: RoomPick) => useRoomPicksStore.getState().addPick(pick);

    // (a) Self-bet bridge — every freshly placed real bet becomes a "You" pick.
    const seenBetIds = new Set(useBetsStore.getState().open.map((bet) => bet.id));
    const unsubscribe = useBetsStore.subscribe((state) => {
      for (const bet of state.open) {
        if (seenBetIds.has(bet.id)) continue;
        seenBetIds.add(bet.id);
        const identity = selfRef.current;
        addPick({
          id: crypto.randomUUID(),
          userId: useAuthStore.getState().user?.id ?? 'self',
          name: identity.displayName,
          avatarSrc: identity.portraitSrc,
          isSelf: true,
          market: bet.market,
          selectionId: bet.selectionId,
          label: pickLabel(bet, teamNameFor(bet.selectionId)),
          odds: bet.odds,
          createdAt: Date.now(),
        });
      }
    });

    // (b) Simulated public book — always on (no room socket to relay real picks globally).
    const timers: number[] = [];
    const recent: string[] = [];

    const fakePick = () => {
      const pool = pickerPool().filter((p) => !recent.includes(p.userId));
      if (pool.length === 0) return;
      const picker = pool[Math.floor(Math.random() * pool.length)];
      recent.push(picker.userId);
      if (recent.length > RECENT_PICKERS) recent.shift();

      const selection = randomSelection();
      addPick({
        id: crypto.randomUUID(),
        userId: picker.userId,
        name: picker.name,
        avatarSrc: picker.avatarSrc,
        isSelf: false,
        market: selection.market,
        selectionId: selection.selectionId,
        label: pickLabel(selection, teamNameFor(selection.selectionId)),
        odds: selection.odds,
        createdAt: Date.now(),
      });
    };

    const schedule = () => {
      const id = window.setTimeout(() => {
        fakePick();
        schedule();
      }, randomBetween(MIN_GAP_MS, MAX_GAP_MS));
      timers.push(id);
    };

    SEED_DELAYS_MS.forEach((delay) => timers.push(window.setTimeout(fakePick, delay)));
    schedule();

    return () => {
      unsubscribe();
      timers.forEach((id) => window.clearTimeout(id));
      useRoomPicksStore.getState().reset();
    };
  }, []);
}
