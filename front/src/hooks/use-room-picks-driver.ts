'use client';

import { useEffect, useRef } from 'react';

import { MarketType } from '@/enums/market-type.enum';
import { RoomEvent } from '@/enums/room-event.enum';
import { BETTING_MARKETS } from '@/config/betting-markets.config';
import { duelists } from '@/config/duelists.config';
import { recapMatch } from '@/config/recap-match.config';
import { useSelfIdentity } from '@/hooks/use-self-identity';
import { personaFor } from '@/lib/persona-fallback';
import { getSocket } from '@/services/realtime/socket';
import { backendEnabled } from '@/services/session-mode';
import { useAuthStore } from '@/store/auth.store';
import { useBetsStore } from '@/store/bets.store';
import { useMatchStore } from '@/store/match.store';
import { useRoomStore } from '@/store/room.store';
import { useRoomPicksStore, type RoomPick } from '@/store/room-picks.store';
import type { BetSelection } from '@/types/bet';

/** Simulated pick cadence — lively but not spammy. */
const MIN_GAP_MS = 8_000;
const MAX_GAP_MS = 20_000;
const SEED_DELAYS_MS = [3_000, 9_000];
/** Share of fake picks that go to the featured Match Result market. */
const MATCH_RESULT_BIAS = 0.6;
/** Don't repeat any of the last N fake pickers. */
const RECENT_PICKERS = 3;

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

/** Room members (except self) merged with the duelist roster — all with real portraits. */
function pickerPool(selfId: string | undefined): FakePicker[] {
  const members = useRoomStore
    .getState()
    .members.filter((m) => m.userId !== selfId)
    .map((m) => ({
      userId: m.userId,
      name: m.displayName,
      avatarSrc: m.avatarUrl ?? personaFor(m.userId),
    }));
  const roster = duelists.map((d) => ({ userId: d.id, name: d.name, avatarSrc: d.portraitSrc }));
  return [...members, ...roster];
}

/**
 * Drives the room's social picks layer: the signed-in user's REAL bets become
 * picks instantly (relayed to the room over `room:pick`). Only when the backend
 * is off (USE_MOCK) do mock members/friends "place picks" on a lively cadence.
 */
export function useRoomPicksDriver(): void {
  const self = useSelfIdentity();
  const selfRef = useRef(self);
  useEffect(() => {
    selfRef.current = self;
  }, [self]);

  useEffect(() => {
    const addPick = (pick: RoomPick) => useRoomPicksStore.getState().addPick(pick);

    // (a) Self-bet bridge — every freshly placed real bet becomes a pick, locally AND relayed to
    // the rest of the room over the socket (room:pick), so friends see each other's REAL actions.
    const seenBetIds = new Set(useBetsStore.getState().open.map((bet) => bet.id));
    const unsubscribe = useBetsStore.subscribe((state) => {
      for (const bet of state.open) {
        if (seenBetIds.has(bet.id)) continue;
        seenBetIds.add(bet.id);
        const identity = selfRef.current;
        const pick: RoomPick = {
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
        };
        addPick(pick);
        const roomId = useRoomStore.getState().roomId;
        if (backendEnabled && roomId) {
          const { createdAt: _createdAt, isSelf: _isSelf, ...wire } = pick;
          getSocket().emit(RoomEvent.Pick, { roomId, ...wire });
        }
      }
    });

    // (b) Fake picker cadence — mock mode only; with the backend on, picks are real bets relayed
    // over the socket (here for the sender, use-room-feed for everyone else).
    const timers: number[] = [];
    if (!backendEnabled) {
      const recent: string[] = [];
      const selfId = useAuthStore.getState().user?.id;

      const fakePick = () => {
        const pool = pickerPool(selfId).filter((p) => !recent.includes(p.userId));
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
    }

    return () => {
      unsubscribe();
      timers.forEach((id) => window.clearTimeout(id));
      useRoomPicksStore.getState().reset();
    };
  }, []);
}
