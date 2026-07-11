import { create } from 'zustand';

import type { MarketType } from '@/enums/market-type.enum';

/** One pick surfaced in the room's social layer (toast + scoreboard backers). */
export interface RoomPick {
  id: string;
  userId: string;
  name: string;
  avatarSrc: string;
  /** True when it's the signed-in user's real bet (styled differently). */
  isSelf: boolean;
  market: MarketType;
  selectionId: string; // 'home' | 'draw' | 'away' | 'over' | ...
  label: string; // "Argentina to win" / "Over 2.5 goals"
  odds: number;
  createdAt: number;
}

/** Wire shape of a pick relayed over the room socket (`room:pick`) — a RoomPick minus local-only fields. */
export interface RoomPickWire {
  roomId: string;
  id: string;
  userId: string;
  name: string;
  avatarSrc: string;
  market: MarketType;
  selectionId: string;
  label: string;
  odds: number;
}

interface RoomPicksStore {
  /** Newest first, capped. */
  picks: RoomPick[];
  addPick: (pick: RoomPick) => void;
  reset: () => void;
}

const MAX_PICKS = 40;

/** Ephemeral social picks for the current room (simulated + the user's real bets). */
export const useRoomPicksStore = create<RoomPicksStore>((set) => ({
  picks: [],
  addPick: (pick) => set((state) => ({ picks: [pick, ...state.picks].slice(0, MAX_PICKS) })),
  reset: () => set({ picks: [] }),
}));

export const useRoomPicks = () => useRoomPicksStore((state) => state.picks);

/**
 * Who currently backs a side — the LATEST pick per user wins (a user switching
 * sides moves stacks), filtered to match-winner picks for the given side.
 */
export function backersFor(picks: RoomPick[], side: 'home' | 'away'): RoomPick[] {
  const latest = new Map<string, RoomPick>();
  // picks is newest-first; keep the first (latest) occurrence per user.
  for (const pick of picks) {
    if (!latest.has(pick.userId)) latest.set(pick.userId, pick);
  }
  return [...latest.values()].filter((pick) => pick.selectionId === side);
}
