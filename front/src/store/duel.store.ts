import { create } from 'zustand';
import type { PlayerProfile } from '@/config/duelists.config';
import { DuelResult } from '@/enums/duel-result.enum';

interface DuelStore {
  /** Stable id for the current /duel/[id] route. */
  duelId: string | null;
  opponent: PlayerProfile | null;
  /** Token stake agreed for this duel (null = friendly, nothing on the line). */
  bet: number | null;
  /** True while the player is picking their XI/formation, before the arena starts. */
  inSetup: boolean;
  selfScore: number;
  opponentScore: number;
  finished: boolean;
  result: DuelResult | null;
  /** Begin a duel against a chosen opponent — opens on the XI/formation setup step. */
  start: (duelId: string, opponent: PlayerProfile, bet?: number) => void;
  /** Lock the lineup and enter the arena. */
  confirmSetup: () => void;
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
  bet: null,
  inSetup: false,
  selfScore: 0,
  opponentScore: 0,
  finished: false,
  result: null,
  start: (duelId, opponent, bet) =>
    set({ duelId, opponent, bet: bet ?? null, inSetup: true, selfScore: 0, opponentScore: 0, finished: false, result: null }),
  confirmSetup: () => set({ inSetup: false }),
  setScore: (selfScore, opponentScore) => set({ selfScore, opponentScore }),
  finish: (result) => set({ finished: true, result }),
  reset: () =>
    set({ duelId: null, opponent: null, bet: null, inSetup: false, selfScore: 0, opponentScore: 0, finished: false, result: null }),
}));
