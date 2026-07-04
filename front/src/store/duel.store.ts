import { create } from 'zustand';
import type { PlayerProfile } from '@/config/duelists.config';
import { DuelResult } from '@/enums/duel-result.enum';

interface DuelStore {
  /** Stable id for the current /duel/[id] route. */
  duelId: string | null;
  opponent: PlayerProfile | null;
  selfScore: number;
  opponentScore: number;
  finished: boolean;
  result: DuelResult | null;
  /** Begin a duel against a chosen opponent. */
  start: (duelId: string, opponent: PlayerProfile) => void;
  /** Push the live scoreline from the engine HUD. */
  setScore: (selfScore: number, opponentScore: number) => void;
  /** Freeze the final result. */
  finish: (result: DuelResult) => void;
  reset: () => void;
}

/** Current 1v1 duel — ephemeral (never persisted; the live stream stays in memory). */
export const useDuelStore = create<DuelStore>((set) => ({
  duelId: null,
  opponent: null,
  selfScore: 0,
  opponentScore: 0,
  finished: false,
  result: null,
  start: (duelId, opponent) =>
    set({ duelId, opponent, selfScore: 0, opponentScore: 0, finished: false, result: null }),
  setScore: (selfScore, opponentScore) => set({ selfScore, opponentScore }),
  finish: (result) => set({ finished: true, result }),
  reset: () => set({ duelId: null, opponent: null, selfScore: 0, opponentScore: 0, finished: false, result: null }),
}));
